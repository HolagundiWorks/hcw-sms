import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// HCW-SMS UI build.
//
// dev   : `npm run dev` serves an HMR dev server on :5173 and a standalone
//         playground at http://localhost:5173/ (index.html). The PHP app loads
//         the same modules from this dev server when HCW_UI_DEV=1 (see
//         functions/ReactAssets.php).
// build : emits a manifest + hashed assets into ../assets/hcw-ui so the PHP
//         pages can serve the islands bundle. Only the `embed` entry is built;
//         index.html is a dev-only playground.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/assets/hcw-ui/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
  },
  build: {
    outDir: '../assets/hcw-ui',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        embed: 'src/embed.tsx',
      },
    },
  },
}));
