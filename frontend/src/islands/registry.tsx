import type { ComponentType } from 'react';
import { DashboardPage } from '../components/DashboardPage';

/**
 * Island registry: maps the name used in a PHP page's `data-hcw-island`
 * attribute to the React component that renders it. Each component receives the
 * parsed `data-hcw-props` JSON as its props.
 *
 * Add a new screen here as you convert each legacy PHP page to React.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ComponentType<any>> = {
  DashboardPage,
};

export type IslandName = keyof typeof registry;
