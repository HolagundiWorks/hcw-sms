import type { ComponentType } from 'react';

/**
 * Minimal structural type for a Tabler icon component. Tabler icons accept many
 * more (all-optional) props; this captures just what we use, and every Tabler
 * icon is assignable to it.
 */
export type IconComponent = ComponentType<{
  size?: number | string;
  stroke?: number;
  className?: string;
}>;
