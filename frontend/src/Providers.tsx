import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './theme.css';

import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';

/** Single source of truth for the Mantine theme / CSS, used by every island
 *  and by the standalone playground. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
