import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// LEOS desktop frontend (Vite + React + Mantine), loaded by the Tauri shell.
//   dev:   `npm run dev` serves on :5174 (host 5173 is taken by another project);
//          Tauri's devUrl points here.
//   build: outputs to ./dist for `cargo tauri build` (tauri frontendDist).
// base "./" keeps asset URLs relative so the Tauri custom protocol resolves them.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
