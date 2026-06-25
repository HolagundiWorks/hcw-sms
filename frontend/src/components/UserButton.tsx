import { Avatar, Box, Group, Menu, Text, UnstyledButton, rem } from '@mantine/core';
import { IconChevronDown, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { roles } from '../roles';
import { initials, type SessionUser } from '../types';

interface UserButtonProps {
  user: SessionUser;
}

/** Avatar-based account control shown in the header. */
export function UserButton({ user }: UserButtonProps) {
  const role = roles[user.role];

  return (
    <Menu position="bottom-end" width={200} radius="lg" shadow="md">
      <Menu.Target>
        <UnstyledButton p="xs" style={{ borderRadius: rem(12) }}>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={user.avatarUrl}
              radius="xl"
              color={role.accent}
              variant="light"
            >
              {initials(user.name)}
            </Avatar>
            <Box style={{ lineHeight: 1.1 }} visibleFrom="sm">
              <Text size="sm" fw={600}>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed">
                {role.label}
              </Text>
            </Box>
            <IconChevronDown size={16} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.email ?? role.label}</Menu.Label>
        <Menu.Item leftSection={<IconUserCircle size={16} stroke={1.5} />}>
          My profile
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="rose" leftSection={<IconLogout size={16} stroke={1.5} />}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
