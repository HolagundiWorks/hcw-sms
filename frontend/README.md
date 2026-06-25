# HCW-SMS UI

Fresh **React + [Mantine](https://mantine.dev) v7** UI for HCW-SMS, embedded
incrementally into the existing HCW-SMS PHP app (based on openSIS) one screen at a time.

Design language: light theme · soft pastel accents · rounded cards · simple
([Tabler](https://tabler.io/icons)) icons · avatar-based people views ·
calendar-first dashboards · clear role-based navigation.

## Prerequisites

Node.js 18+ and npm. (Node is **not** currently installed on this machine —
install it from <https://nodejs.org> first.)

## Install & run

```bash
cd frontend
npm install

# 1) Standalone playground (no PHP) with HMR + a role switcher:
npm run dev            # http://localhost:5173

# 2) Production build (emits hashed assets + manifest into ../assets/hcw-ui):
npm run build
```

## How the embedding works

The new UI ships as **islands**: small React roots mounted into specific PHP
pages. Nothing about the legacy page changes except two calls.

1. `npm run build` writes the bundle to `../assets/hcw-ui` (git-ignored) plus a
   Vite `manifest.json`.
2. A PHP page loads the bundle and declares a mount point using the helper in
   [`functions/ReactAssets.php`](../functions/ReactAssets.php):

   ```php
   require_once 'functions/ReactAssets.php';
   hcw_ui_assets();                                  // <head>: load the bundle once
   hcw_ui_island('DashboardPage', [                  // <body>: mount a screen
       'user' => ['name' => $name, 'role' => 'teacher'],
   ]);
   ```
3. On load, `embed.tsx` scans for `[data-hcw-island]` elements, parses the
   `data-hcw-props` JSON, wraps the component in the Mantine theme, and renders
   it. For markup injected later (AJAX), call `window.HcwUi.mountAll()`.

See [`../ui-demo.php`](../ui-demo.php) for a full working example
(`http://localhost:8080/ui-demo.php` via the Podman stack).

### Live reload against the PHP app (dev)

Set `HCW_UI_DEV=1` for the web container and run `npm run dev`. The PHP helper
then loads modules straight from the Vite dev server (with Fast Refresh) instead
of the built bundle.

## Adding a screen

1. Build the component under `src/components/` (compose `AppShellLayout` for full
   pages, like `DashboardPage`).
2. Register it in [`src/islands/registry.tsx`](src/islands/registry.tsx).
3. Drop `hcw_ui_island('YourComponent', [...])` into the PHP page you're
   converting.

## Layout

```
src/
  theme.ts            Mantine theme — pastel palettes, rounded radii, component defaults
  theme.css           scoped wrapper styles for every React root
  roles.ts            roles + role-based nav config (admin/teacher/student/parent)
  types.ts            SessionUser + helpers
  Providers.tsx       MantineProvider + CSS imports
  Playground.tsx      no-PHP preview with a role switcher
  main.tsx            playground entry (index.html)
  embed.tsx           production islands entry (built into ../assets/hcw-ui)
  islands/
    registry.tsx      island name -> component map
    mount.tsx         DOM scan + mount with providers
  components/
    AppShellLayout.tsx  header + role-based navbar shell
    RoleNav.tsx         sidebar navigation
    UserButton.tsx      avatar account menu
    DashboardPage.tsx   calendar-first dashboard (sample data)
```
