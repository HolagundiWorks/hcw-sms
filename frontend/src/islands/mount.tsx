import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Providers } from '../Providers';
import { registry } from './registry';

const ISLAND_ATTR = 'data-hcw-island';
const PROPS_ATTR = 'data-hcw-props';

// Track mounted roots so re-scanning the DOM never double-mounts a node.
const mounted = new WeakMap<Element, Root>();

function parseProps(el: Element): Record<string, unknown> {
  const raw = el.getAttribute(PROPS_ATTR);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    console.error('[hcw-ui] invalid', PROPS_ATTR, 'on', el, err);
    return {};
  }
}

/** Mount a single host element if it carries a known island name. */
export function mountIsland(el: Element): void {
  if (mounted.has(el)) return;

  const name = el.getAttribute(ISLAND_ATTR);
  if (!name) return;

  const Component = registry[name];
  if (!Component) {
    console.error(
      `[hcw-ui] unknown island "${name}". Registered:`,
      Object.keys(registry),
    );
    return;
  }

  el.classList.add('hcw-ui');
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <Providers>
        <Component {...parseProps(el)} />
      </Providers>
    </StrictMode>,
  );
  mounted.set(el, root);
}

/** Scan a subtree and mount every `[data-hcw-island]` host found. */
export function mountAll(scope: ParentNode = document): void {
  scope.querySelectorAll(`[${ISLAND_ATTR}]`).forEach(mountIsland);
}
