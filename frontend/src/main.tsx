import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './Providers';
import { App } from './App';

const host = document.getElementById('hcw-playground');
if (host) {
  createRoot(host).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  );
}
