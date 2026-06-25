import { useState, type ReactNode } from 'react';
import { AppShell, Burger, Group, Text, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSchool } from '@tabler/icons-react';
import { roles } from '../roles';
import type { SessionUser } from '../types';
import { RoleNav } from './RoleNav';
import { UserButton } from './UserButton';

interface AppShellLayoutProps {
  user: SessionUser;
  /** Currently active nav key. Defaults to the first item ("dashboard"). */
  activeKey?: string;
  /**
   * Called when a nav item is clicked. In the PHP-embedded app this should
   * navigate to the matching Modules.php URL; in the playground it just
   * updates local state.
   */
  onNavigate?: (key: string) => void;
  children: ReactNode;
}

function Brand({ accent }: { accent: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon radius="md" size={34} variant="light" color={accent}>
        <IconSchool size={20} stroke={1.6} />
      </ThemeIcon>
      <Text fw={700} size="lg" lh={1}>
        HCW-SMS
      </Text>
    </Group>
  );
}

export function AppShellLayout({
  user,
  activeKey,
  onNavigate,
  children,
}: AppShellLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const [internalActive, setInternalActive] = useState(activeKey ?? 'dashboard');
  const accent = roles[user.role].accent;

  const handleNavigate = (key: string) => {
    setInternalActive(key);
    close();
    onNavigate?.(key);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 264, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Brand accent={accent} />
          </Group>
          <UserButton user={user} />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <RoleNav
          role={user.role}
          activeKey={activeKey ?? internalActive}
          onNavigate={handleNavigate}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
