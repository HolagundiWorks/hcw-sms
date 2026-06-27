//! LEOS Service Manager.
//!
//! Internal service layer that keeps the user-facing app as ONE program while
//! treating the Rust API backend as a separately managed service. The UI sees a
//! single LEOS app; under the hood this module supervises the backend:
//!
//!   start · stop · restart · health · logs · repair · auto-restart
//!
//! It is built behind the [`ServerController`] trait so the backend
//! implementation can change without touching the UI or command layer. Phase 1
//! ships [`ChildProcessController`], which runs `leos-server` as a supervised
//! child process (no admin/elevation required). A future Windows-Service backend
//! can implement the same trait and be swapped in for production deployments.

use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

const MAX_LOG_LINES: usize = 500;
const MAX_AUTO_RESTARTS: u32 = 5;
const HEALTH_TIMEOUT: Duration = Duration::from_millis(700);

/// Lifecycle state of the backend, as shown in the Control Panel.
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ServerState {
    Stopped,
    Starting,
    Running,
    Crashed,
    Repairing,
}

/// Snapshot of the backend for the UI. Serializes to the JSON the React panel
/// reads via the `server_status` Tauri command.
#[derive(Clone, serde::Serialize)]
pub struct ServerStatus {
    pub state: ServerState,
    pub healthy: bool,
    pub port: u16,
    pub pid: Option<u32>,
    pub uptime_secs: u64,
    /// Auto-restart the backend if it exits unexpectedly.
    pub autostart: bool,
    /// true = this layer can start/stop the backend (supervised child process);
    /// false = backend is embedded in-process and can't be controlled live.
    pub managed: bool,
    pub backend: &'static str,
    pub binary: Option<String>,
    pub last_error: Option<String>,
}

/// Abstraction over "how the backend runs". Lets a Windows-Service backend slot
/// in later (phase 2) behind the same UI + commands.
pub trait ServerController: Send + Sync {
    fn start(&self) -> Result<(), String>;
    fn stop(&self) -> Result<(), String>;
    fn restart(&self) -> Result<(), String> {
        let _ = self.stop();
        thread::sleep(Duration::from_millis(300));
        self.start()
    }
    fn repair(&self) -> Result<(), String>;
    fn status(&self) -> ServerStatus;
    fn logs(&self, limit: usize) -> Vec<String>;
    fn set_autostart(&self, enabled: bool);
}

struct Inner {
    child: Option<Child>,
    state: ServerState,
    started_at: Option<Instant>,
    healthy: bool,
    autostart: bool,
    /// User asked to stop — the supervisor must NOT auto-restart.
    stopping: bool,
    /// Backend is embedded in-process (fallback when no binary is available).
    embedded: bool,
    restart_count: u32,
    last_error: Option<String>,
}

/// Supervises `leos-server` as a child process.
pub struct ChildProcessController {
    inner: Arc<Mutex<Inner>>,
    logs: Arc<Mutex<VecDeque<String>>>,
    port: u16,
    binary: Option<PathBuf>,
}

impl ChildProcessController {
    /// Resolve the binary + port and start the background supervisor. Never
    /// fails: if the binary is missing, `start()` reports it and the app can
    /// fall back to the embedded backend via [`mark_embedded`].
    pub fn new() -> Self {
        let binary = resolve_binary();
        let logs: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));
        match &binary {
            Some(p) => push_log(&logs, format!("[manager] backend binary: {}", p.display())),
            None => push_log(
                &logs,
                "[manager] no leos-server binary found; will use embedded fallback".into(),
            ),
        }
        let ctrl = ChildProcessController {
            inner: Arc::new(Mutex::new(Inner {
                child: None,
                state: ServerState::Stopped,
                started_at: None,
                healthy: false,
                autostart: true,
                stopping: false,
                embedded: false,
                restart_count: 0,
                last_error: None,
            })),
            logs,
            port: leos_server::configured_port(),
            binary,
        };
        ctrl.spawn_supervisor();
        ctrl
    }

    /// Mark that the backend is running embedded in this process (fallback).
    /// The panel then shows it as unmanaged (health/logs only, no stop/restart).
    pub fn mark_embedded(&self) {
        let mut g = self.inner.lock().unwrap();
        g.embedded = true;
        g.state = ServerState::Starting; // health probe will flip to Running
        push_log(&self.logs, "[manager] backend running embedded (in-process)".into());
    }

    fn spawn_supervisor(&self) {
        let inner = self.inner.clone();
        let logs = self.logs.clone();
        let port = self.port;
        let binary = self.binary.clone();
        thread::spawn(move || loop {
            thread::sleep(Duration::from_secs(1));

            // 1) Reap the child if it exited; decide whether to auto-restart.
            let mut restart = false;
            {
                let mut g = inner.lock().unwrap();
                if let Some(child) = g.child.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            g.child = None;
                            g.started_at = None;
                            g.healthy = false;
                            if g.stopping {
                                g.stopping = false;
                                g.state = ServerState::Stopped;
                                push_log(&logs, "[manager] backend stopped".into());
                            } else {
                                g.state = ServerState::Crashed;
                                g.last_error =
                                    Some(format!("backend exited unexpectedly ({status})"));
                                push_log(&logs, format!("[manager] backend crashed ({status})"));
                                if g.autostart && g.restart_count < MAX_AUTO_RESTARTS {
                                    g.restart_count += 1;
                                    restart = true;
                                }
                            }
                        }
                        Ok(None) => {}
                        Err(_) => {}
                    }
                }
            }

            // 2) Probe health outside the lock, then fold the result back in.
            let healthy = probe_health(port);
            {
                let mut g = inner.lock().unwrap();
                if g.child.is_some() || g.embedded {
                    g.healthy = healthy;
                    if healthy {
                        if g.state == ServerState::Starting {
                            g.state = ServerState::Running;
                        }
                        if g.embedded {
                            g.state = ServerState::Running;
                        }
                        g.restart_count = 0;
                    }
                }
            }

            // 3) Auto-restart if the supervisor decided to.
            if restart {
                push_log(&logs, "[manager] auto-restarting backend".into());
                if let Some(bin) = &binary {
                    if let Err(e) = spawn_child(&inner, &logs, bin) {
                        let mut g = inner.lock().unwrap();
                        g.last_error = Some(e.clone());
                        push_log(&logs, format!("[manager] auto-restart failed: {e}"));
                    }
                }
            }
        });
    }
}

impl ServerController for ChildProcessController {
    fn start(&self) -> Result<(), String> {
        {
            let mut g = self.inner.lock().unwrap();
            if g.embedded {
                return Err("backend is embedded; restart the LEOS app instead".into());
            }
            if g.child.is_some() {
                return Ok(()); // already running
            }
            g.stopping = false;
            g.restart_count = 0;
            g.state = ServerState::Starting;
        }
        let bin = self
            .binary
            .as_ref()
            .ok_or_else(|| "leos-server binary not found".to_string())?;
        spawn_child(&self.inner, &self.logs, bin)
    }

    fn stop(&self) -> Result<(), String> {
        let mut g = self.inner.lock().unwrap();
        if g.embedded {
            return Err("backend is embedded and cannot be stopped without closing LEOS".into());
        }
        match g.child.take() {
            Some(mut child) => {
                g.stopping = true;
                let _ = child.kill();
                let _ = child.wait();
                g.state = ServerState::Stopped;
                g.healthy = false;
                g.started_at = None;
                push_log(&self.logs, "[manager] stop requested".into());
                Ok(())
            }
            None => {
                g.state = ServerState::Stopped;
                Ok(())
            }
        }
    }

    fn repair(&self) -> Result<(), String> {
        push_log(&self.logs, "[manager] repair: stopping backend".into());
        {
            let mut g = self.inner.lock().unwrap();
            g.state = ServerState::Repairing;
        }
        let _ = self.stop();

        // Validate the database before bringing the backend back up.
        match leos_server::check_db_health() {
            Ok(()) => push_log(&self.logs, "[manager] repair: database integrity OK".into()),
            Err(e) => {
                push_log(&self.logs, format!("[manager] repair: DB problem — {e}"));
                self.inner.lock().unwrap().last_error = Some(format!("database: {e}"));
            }
        }

        push_log(&self.logs, "[manager] repair: restarting backend".into());
        self.start()
    }

    fn status(&self) -> ServerStatus {
        let g = self.inner.lock().unwrap();
        ServerStatus {
            state: g.state,
            healthy: g.healthy,
            port: self.port,
            pid: g.child.as_ref().map(|c| c.id()),
            uptime_secs: g.started_at.map(|t| t.elapsed().as_secs()).unwrap_or(0),
            autostart: g.autostart,
            managed: !g.embedded,
            backend: if g.embedded { "embedded" } else { "child-process" },
            binary: self.binary.as_ref().map(|p| p.display().to_string()),
            last_error: g.last_error.clone(),
        }
    }

    fn logs(&self, limit: usize) -> Vec<String> {
        let g = self.logs.lock().unwrap();
        let n = g.len();
        let start = n.saturating_sub(limit);
        g.iter().skip(start).cloned().collect()
    }

    fn set_autostart(&self, enabled: bool) {
        let mut g = self.inner.lock().unwrap();
        g.autostart = enabled;
        push_log(
            &self.logs,
            format!("[manager] auto-restart {}", if enabled { "enabled" } else { "disabled" }),
        );
    }
}

// ---- helpers ----

fn push_log(logs: &Arc<Mutex<VecDeque<String>>>, line: String) {
    let mut g = logs.lock().unwrap();
    let ts = chrono_now();
    g.push_back(format!("{ts}  {line}"));
    while g.len() > MAX_LOG_LINES {
        g.pop_front();
    }
}

/// Minimal HH:MM:SS timestamp without pulling in a date crate.
fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let (h, m, s) = ((secs / 3600) % 24, (secs / 60) % 60, secs % 60);
    format!("{h:02}:{m:02}:{s:02}")
}

/// Spawn `leos-server` and pump its stdout/stderr into the shared log buffer.
fn spawn_child(
    inner: &Arc<Mutex<Inner>>,
    logs: &Arc<Mutex<VecDeque<String>>>,
    binary: &PathBuf,
) -> Result<(), String> {
    let mut cmd = Command::new(binary);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    // Don't pop a console window for the child on Windows (CREATE_NO_WINDOW).
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    let mut child = cmd.spawn().map_err(|e| format!("could not start backend: {e}"))?;
    let pid = child.id();
    if let Some(out) = child.stdout.take() {
        pipe_to_logs(out, logs.clone());
    }
    if let Some(err) = child.stderr.take() {
        pipe_to_logs(err, logs.clone());
    }
    let mut g = inner.lock().unwrap();
    g.child = Some(child);
    g.started_at = Some(Instant::now());
    g.state = ServerState::Starting;
    push_log(logs, format!("[manager] backend started (pid {pid})"));
    Ok(())
}

fn pipe_to_logs<R: Read + Send + 'static>(reader: R, logs: Arc<Mutex<VecDeque<String>>>) {
    thread::spawn(move || {
        let buf = BufReader::new(reader);
        for line in buf.lines().map_while(Result::ok) {
            push_log(&logs, line);
        }
    });
}

/// Probe `GET /health` over a short-timeout TCP connection (no HTTP crate).
fn probe_health(port: u16) -> bool {
    let addr: SocketAddr = match format!("127.0.0.1:{port}").parse() {
        Ok(a) => a,
        Err(_) => return false,
    };
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, HEALTH_TIMEOUT) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(HEALTH_TIMEOUT));
    let _ = stream.set_write_timeout(Some(HEALTH_TIMEOUT));
    let req = "GET /health HTTP/1.0\r\nHost: localhost\r\nConnection: close\r\n\r\n";
    if stream.write_all(req.as_bytes()).is_err() {
        return false;
    }
    let mut body = String::new();
    let _ = stream.read_to_string(&mut body);
    body.contains("200") && body.contains("\"ok\"")
}

/// Locate the `leos-server` binary: explicit override, alongside the app
/// executable (production sidecar), or the dev build under `server/target`.
fn resolve_binary() -> Option<PathBuf> {
    let exe = if cfg!(windows) { "leos-server.exe" } else { "leos-server" };

    if let Some(p) = std::env::var_os("LEOS_SERVER_BIN") {
        let p = PathBuf::from(p);
        if p.is_file() {
            return Some(p);
        }
    }

    // Next to the LEOS executable (how it ships in production).
    if let Ok(cur) = std::env::current_exe() {
        if let Some(dir) = cur.parent() {
            let cand = dir.join(exe);
            if cand.is_file() {
                return Some(cand);
            }
        }
    }

    // Dev builds: <repo>/server/target/{release,debug}/leos-server[.exe].
    // Pick whichever exists and was built most recently, so a fresh `cargo build`
    // is always used even if a stale release/debug binary lingers.
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let mut newest: Option<(PathBuf, std::time::SystemTime)> = None;
    for profile in ["release", "debug"] {
        let cand = manifest.join("../server/target").join(profile).join(exe);
        if let Ok(meta) = std::fs::metadata(&cand) {
            if let Ok(mtime) = meta.modified() {
                if newest.as_ref().map(|(_, t)| mtime > *t).unwrap_or(true) {
                    newest = Some((cand, mtime));
                }
            }
        }
    }
    newest.map(|(p, _)| p)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Exercises the real supervisor lifecycle: spawn the backend as a child
    /// process, wait for it to report healthy, then stop it. Uses an isolated
    /// port + temp data dir so it never collides with a dev server or touches
    /// real data. Requires the leos-server binary (built by `cargo build`).
    #[test]
    fn supervises_real_backend_lifecycle() {
        let dir = std::env::temp_dir().join(format!("leos-sm-test-{}", std::process::id()));
        let _ = std::fs::create_dir_all(&dir);
        std::env::set_var("LEOS_PORT", "8791");
        std::env::set_var("LEOS_DATA_DIR", &dir);

        let ctrl = ChildProcessController::new();
        if ctrl.binary.is_none() {
            eprintln!("skipping: leos-server binary not built");
            return;
        }

        ctrl.start().expect("start should spawn the backend");

        // Wait up to ~15s for the supervisor to see a healthy backend.
        let mut healthy = false;
        for _ in 0..30 {
            thread::sleep(Duration::from_millis(500));
            let s = ctrl.status();
            if s.healthy && s.state == ServerState::Running {
                healthy = true;
                assert!(s.pid.is_some(), "running backend should have a pid");
                assert!(s.managed, "child-process backend is managed");
                break;
            }
        }
        assert!(healthy, "backend never became healthy; logs:\n{}", ctrl.logs(50).join("\n"));

        ctrl.stop().expect("stop should kill the backend");
        let after = ctrl.status();
        assert_eq!(after.state, ServerState::Stopped);
        assert!(after.pid.is_none(), "stopped backend should have no pid");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
