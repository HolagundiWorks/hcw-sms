// Launch an isolated LEOS API server for tests.
//
// Isolation strategy (no production data is ever touched):
//   * LEOS_DATA_DIR  -> a throwaway temp folder; the server creates its
//                       school.sqlite + school.leosdb there on first run.
//   * LEOS_PORT      -> a dedicated test port, so a running dev server (8787)
//                       does not clash.
// Both overrides were added to server/src/lib.rs specifically for testability.
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT } from './env';

export interface TestServer {
  baseUrl: string;
  dataDir: string;
  /** Absolute path to the live SQLite file — used by DB tests for assertions. */
  dbPath: string;
  stop: () => Promise<void>;
}

function serverBinary(): string {
  const exe = process.platform === 'win32' ? 'leos-server.exe' : 'leos-server';
  const candidates = ['release', 'debug'].map((p) =>
    path.join(REPO_ROOT, 'server', 'target', p, exe),
  );
  // Pick whichever exists and is newmost-recently built, so a fresh
  // `cargo build` is always used even if a stale release/debug binary lingers.
  const found = candidates
    .filter((p) => fs.existsSync(p))
    .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (found.length > 0) return found[0].p;
  throw new Error(
    `leos-server binary not found.\nBuild it first:\n  cd server && cargo build\n(looked for ${candidates.join(' and ')})`,
  );
}

async function waitForHealth(baseUrl: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${baseUrl} never became healthy: ${String(lastErr)}`);
}

/** Start a fresh, isolated server on `port` with its own temp data directory. */
export async function startTestServer(port: number): Promise<TestServer> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), `leos-test-${port}-`));
  const baseUrl = `http://localhost:${port}`;

  const child: ChildProcess = spawn(serverBinary(), [], {
    cwd: dataDir,
    env: {
      ...process.env,
      LEOS_DATA_DIR: dataDir,
      LEOS_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logs: string[] = [];
  child.stdout?.on('data', (d) => logs.push(String(d)));
  child.stderr?.on('data', (d) => logs.push(String(d)));
  child.on('exit', (code) => {
    if (code && code !== 0) {
      // eslint-disable-next-line no-console
      console.error(`leos-server (test) exited ${code}:\n${logs.join('')}`);
    }
  });

  try {
    await waitForHealth(baseUrl);
  } catch (e) {
    child.kill();
    throw new Error(`${e instanceof Error ? e.message : e}\n--- server output ---\n${logs.join('')}`);
  }

  const stop = () =>
    new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.killed) return resolve();
      child.once('exit', () => resolve());
      child.kill();
      // Hard-stop fallback so a hung process can't wedge the suite.
      setTimeout(() => {
        if (child.exitCode === null) child.kill('SIGKILL');
        resolve();
      }, 3_000);
    });

  return { baseUrl, dataDir, dbPath: path.join(dataDir, 'school.sqlite'), stop };
}
