# HCW-SMS UI

The React + **Mantine** v7 cockpit UI for HCW-SMS, loaded by the Tauri desktop
shell. It talks to the local **Rust + SQLite** API over HTTP (`:8787`) — state via
**Zustand** (auth/selection) + **TanStack Query** (server data), icons via
**Lucide**.

Design: "school operations cockpit" — thin utility strip · 48px latent icon rail ·
bottom context ribbon · Ctrl-K command palette · active work-queue dashboard.

## Develop

Needs Node 18+. The UI needs the API running — either the standalone server
(`cargo run --manifest-path ../server/Cargo.toml`, serves `:8787`) or the Tauri
app (`cargo tauri dev`, embeds it).

```bash
npm install
npm run dev        # http://localhost:5174  (login: admin / admin123)
npm run build      # -> dist (bundled by Tauri's frontendDist)
npm run typecheck  # tsc --noEmit
```

The API base URL defaults to `http://localhost:8787`; override with
`VITE_API_BASE` (e.g. a LAN server at `http://192.168.1.10:8787`).

## Layout

```
src/
  api/client.ts          typed fetch client for the Rust API
  stores/                Zustand: auth (persisted), selection (drives ribbon)
  hooks/                 TanStack Query hooks (students, staff, courses, …)
  lib/queryClient.ts     QueryClient (auto sign-out on 401)
  theme.ts / theme.css   Mantine "School OS" theme
  modules.ts             icon-rail modules + per-module ribbon actions
  components/cockpit/     UtilityStrip · IconRail · ContextRibbon · CommandPalette · CockpitShell
  components/             screens: Dashboard · Students · StudentProfile · Staff · Courses · Subjects
  App.tsx                auth gate + active-module routing
```
