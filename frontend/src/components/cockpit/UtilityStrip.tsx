import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Indicator,
  Menu,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { spotlight } from '@mantine/spotlight';
import { Bell, LogOut, School, Search, UserCircle, Wifi } from 'lucide-react';
import { roleLabel } from '../../roles';
import { initials, type SessionUser } from '../../types';
import { useAuth } from '../../stores/auth';

const ACADEMIC_YEAR = '2026–27';

export function UtilityStrip({ user }: { user: SessionUser }) {
  const signOut = useAuth((s) => s.signOut);

  return (
    <Group h="100%" px="sm" justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon size={26} radius="md" variant="light" color="brand">
          <School size={16} strokeWidth={2} />
        </ThemeIcon>
        <Text fw={600} size="sm" lh={1}>
          HCW-SMS
        </Text>
        <Text size="xs" c="dimmed" visibleFrom="sm">
          School Of Architecture
        </Text>
      </Group>

      {/* Global search opens the command palette (Ctrl K). */}
      <UnstyledButton
        onClick={() => spotlight.open()}
        style={{
          flex: 1,
          maxWidth: 460,
          height: 28,
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-gray-2)',
          background: 'var(--mantine-color-gray-0)',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--mantine-color-gray-5)',
        }}
      >
        <Search size={15} strokeWidth={1.9} />
        <Text size="xs" c="dimmed">
          Search students, staff, actions…
        </Text>
        <Badge ml="auto" size="xs" variant="default" radius="sm">
          Ctrl K
        </Badge>
      </UnstyledButton>

      <Group gap="xs" wrap="nowrap">
        <Badge variant="light" color="gray" radius="sm" visibleFrom="sm">
          AY {ACADEMIC_YEAR}
        </Badge>
        <LanStatus />
        <Indicator color="peach" size={7} offset={4}>
          <ActionIcon variant="subtle" color="gray" aria-label="Alerts">
            <Bell size={18} strokeWidth={1.9} />
          </ActionIcon>
        </Indicator>

        <Menu position="bottom-end" width={200} radius="md" shadow="md">
          <Menu.Target>
            <UnstyledButton>
              <Group gap={8} wrap="nowrap">
                <Avatar size={28} radius="xl" color="brand" variant="light">
                  {initials(user.name)}
                </Avatar>
                <Box style={{ lineHeight: 1.1 }} visibleFrom="sm">
                  <Text size="xs" fw={600}>
                    {user.name}
                  </Text>
                  <Text fz={10} c="dimmed">
                    {roleLabel[user.role]}
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<UserCircle size={16} />}>My profile</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="rose" onClick={signOut} leftSection={<LogOut size={16} />}>
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}

/** LAN/server status indicator. */
function LanStatus() {
  return (
    <Group gap={4} wrap="nowrap" visibleFrom="md" c="dimmed">
      <Wifi size={15} strokeWidth={1.9} color="var(--mantine-color-mint-6)" />
      <Text fz={10}>LAN</Text>
    </Group>
  );
}
