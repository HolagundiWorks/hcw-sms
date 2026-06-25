import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Playground } from './Playground';

// Standalone dev playground entry (index.html). Not part of the embedded build.
const host = document.getElementById('hcw-playground');
if (host) {
  createRoot(host).render(
    <StrictMode>
      <Playground />
    </StrictMode>,
  );
}
