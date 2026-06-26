/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the LEOS API server (e.g. http://localhost:8787). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
