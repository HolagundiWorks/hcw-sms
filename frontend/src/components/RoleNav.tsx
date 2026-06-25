import { NavLink, Stack } from '@mantine/core';
import { roles, type Role } from '../roles';

interface RoleNavProps {
  role: Role;
  activeKey: string;
  onNavigate: (key: string) => void;
}

/** Role-aware sidebar navigation. The item set + accent come from roles.ts. */
export function RoleNav({ role, activeKey, onNavigate }: RoleNavProps) {
  const { nav, accent } = roles[role];

  return (
    <Stack gap={4}>
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.key}
            label={item.label}
            active={item.key === activeKey}
            color={accent}
            variant="light"
            leftSection={<Icon size={20} stroke={1.6} />}
            onClick={() => onNavigate(item.key)}
            style={{ borderRadius: 'var(--mantine-radius-md)' }}
          />
        );
      })}
    </Stack>
  );
}
