// LEOS desktop shell. Loads the React SPA (dev: Vite at devUrl; prod:
// bundled frontendDist). The SPA talks to the Rust API over HTTP via the
// webview's native fetch.
//
// The backend is supervised by the internal Service Manager (server_manager):
// LEOS launches it as a child process and can start/stop/restart/repair it from
// the in-app Server Control Panel. If no backend binary is available we fall
// back to running it embedded in-process so the app still works.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod server_manager;

use server_manager::{ChildProcessController, ServerController, ServerStatus};
use std::sync::Arc;

type Server = Arc<dyn ServerController>;

#[tauri::command]
fn server_status(server: tauri::State<'_, Server>) -> ServerStatus {
    server.status()
}

#[tauri::command]
fn server_start(server: tauri::State<'_, Server>) -> Result<ServerStatus, String> {
    server.start()?;
    Ok(server.status())
}

#[tauri::command]
fn server_stop(server: tauri::State<'_, Server>) -> Result<ServerStatus, String> {
    server.stop()?;
    Ok(server.status())
}

#[tauri::command]
fn server_restart(server: tauri::State<'_, Server>) -> Result<ServerStatus, String> {
    server.restart()?;
    Ok(server.status())
}

#[tauri::command]
fn server_repair(server: tauri::State<'_, Server>) -> Result<ServerStatus, String> {
    server.repair()?;
    Ok(server.status())
}

#[tauri::command]
fn server_logs(server: tauri::State<'_, Server>, limit: Option<usize>) -> Vec<String> {
    server.logs(limit.unwrap_or(200))
}

#[tauri::command]
fn server_set_autostart(server: tauri::State<'_, Server>, enabled: bool) -> ServerStatus {
    server.set_autostart(enabled);
    server.status()
}

fn main() {
    // Bring the backend up under supervision; fall back to embedded if the
    // standalone binary isn't available (e.g. a partial install).
    let controller = Arc::new(ChildProcessController::new());
    if let Err(e) = controller.start() {
        eprintln!("[LEOS] supervised backend start failed ({e}); using embedded backend");
        controller.mark_embedded();
        std::thread::spawn(leos_server::run);
    }

    let server: Server = controller;
    let on_exit = server.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(server)
        .invoke_handler(tauri::generate_handler![
            server_status,
            server_start,
            server_stop,
            server_restart,
            server_repair,
            server_logs,
            server_set_autostart,
        ])
        .build(tauri::generate_context!())
        .expect("error while running LEOS")
        .run(move |_app, event| {
            // Stop the supervised backend when the app quits so it doesn't
            // linger holding the port.
            if let tauri::RunEvent::Exit = event {
                let _ = on_exit.stop();
            }
        });
}
