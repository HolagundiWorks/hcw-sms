# HCW School Management System (HCW-SMS)

An **offline-first, desktop-first** school management system — a calm "school
operations cockpit" rather than another ERP dashboard. It runs as a native
desktop app, keeps all data in a portable file, and needs no internet.

> Reimagined from **openSIS Classic** (GPL, by [OS4ED](https://www.os4ed.com/)) —
> see [Attribution](#attribution). The original PHP/MySQL stack has been replaced
> by a native Rust + SQLite core.

---

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | **Tauri v2** (single self-contained `.exe`, WebView2) |
| UI | **React + TypeScript + Vite**, **Mantine** components, **Lucide** icons |
| Client state / data | **Zustand** (auth/selection) + **TanStack Query** (server state) |
| Core / API | **Rust** HTTP server embedded in the app (also runnable standalone) |
| Database | **SQLite** (`rusqlite`, bundled) |
| Portable data file | **`.schoolpkg`** (ZIP: `manifest.json` + `school.sqlite` + `media/` + `documents/` + checksum) |
| Auth | bcrypt + bearer token |

## How it works

```
┌──────────────────────────────────────────────┐
│  HCW-SMS.exe  (Tauri desktop window)           │
│                                                │
│   React / Mantine cockpit UI                   │
│        │  fetch http://localhost:8787          │
│        ▼                                        │
│   Embedded Rust API server (thread)            │
│        │                                        │
│        ▼                                        │
│   SQLite  (school.sqlite)                       │
│        ▲                                        │
│        └── open / save ──►  School.schoolpkg    │  ← portable, "Tally-style"
└──────────────────────────────────────────────┘
        (LAN mode: other PCs point at this server's IP:8787)
```

- The UI never talks to SQLite directly — it calls the Rust API (`/auth`,
  `/students`, `/staff`, `/courses`, `/subjects`, `/dashboard/*`, `/schoolpkg/*`).
- The same Rust server runs **embedded in the desktop app** (production) or as a
  **standalone process** (development), so the web UI stays testable in a browser.
- A school's entire data set lives in one **`.schoolpkg`** file you can copy,
  back up, or move between machines.

### Cockpit UI

No wide sidebar. A thin **utility strip** (school · search · year · alerts ·
user), a **48px latent icon rail**, a **bottom context ribbon** whose actions
change per module (and per selected row), and a **Ctrl-K command palette**. The
dashboard is an **active work queue** ("what needs attention"), not passive stats.

## Features so far

Login · work-queue dashboard · Students (list, search, profile) · Staff ·
Courses · Subjects · selectable rows that drive the ribbon · portable `.schoolpkg`
save/open. See [ROADMAP.md](ROADMAP.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Running it (development)

**Prerequisites:** [Node.js](https://nodejs.org) 18+, [Rust](https://rustup.rs)
(stable-msvc) + MSVC build tools, and WebView2 (preinstalled on Win 10/11).

```bash
# 1. API server (Rust + SQLite) — creates/seeds school.sqlite, serves :8787
cargo run --manifest-path server/Cargo.toml

# 2. Frontend dev server (Vite) — :5174
cd frontend && npm install && npm run dev

# 3. (optional) Native desktop window — embeds the server, opens the app
cargo tauri dev
```

Open `http://localhost:5174` (or the desktop window). **Login: `admin` / `admin123`.**

### Production build

```bash
cd frontend && npm run build      # → frontend/dist
cargo tauri build                 # → src-tauri/target/release/bundle (MSI + NSIS)
```

## Attribution

HCW-SMS is derived from **openSIS Classic Community Edition** by Open Solutions
for Education, Inc. (OS4ED), and remains under the **GNU GPL v2** — see
[`docs/License.txt`](docs/License.txt). openSIS attribution is retained in the
source headers per the license.
