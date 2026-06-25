/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the HCW-SMS PHP API (e.g. http://localhost:8080/api/v1). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
