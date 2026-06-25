import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { IconProps } from '@tabler/icons-react';

/** The exact type of a @tabler/icons-react icon component, so every icon
 *  (IconUsers, IconCalendarEvent, …) is assignable to it. */
export type IconComponent = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;
