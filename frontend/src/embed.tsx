import { mountAll, mountIsland } from './islands/mount';

// Production / embedded entry point. Built into ../assets/hcw-ui and loaded by
// legacy PHP pages. Auto-mounts any island present at load, and exposes a small
// API on window for pages that inject markup later (e.g. via AJAX).
declare global {
  interface Window {
    HcwUi?: {
      mountAll: typeof mountAll;
      mountIsland: typeof mountIsland;
    };
  }
}

window.HcwUi = { mountAll, mountIsland };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountAll());
} else {
  mountAll();
}
