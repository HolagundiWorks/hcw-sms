import { useState } from 'react';
import { Affix, Paper, SegmentedControl, Text } from '@mantine/core';
import { Providers } from './Providers';
import { DashboardPage } from './components/DashboardPage';
import { roleList, roles, type Role } from './roles';
import type { SessionUser } from './types';

const sampleNames: Record<Role, string> = {
  admin: 'Priya Menon',
  teacher: 'Anika Rao',
  student: 'Rohan Sharma',
  parent: 'Meera Sharma',
};

/** No-PHP preview of the new UI with a floating role switcher. */
export function Playground() {
  const [role, setRole] = useState<Role>('admin');
  const user: SessionUser = {
    name: sampleNames[role],
    role,
    email: `${role}@hcw.school`,
  };

  return (
    <Providers>
      {/* key resets per-role state so the shell re-renders cleanly */}
      <DashboardPage key={role} user={user} />

      <Affix position={{ bottom: 20, right: 20 }}>
        <Paper p="sm" radius="xl" shadow="md" withBorder>
          <Text size="xs" c="dimmed" mb={6} ta="center" fw={600}>
            Preview role
          </Text>
          <SegmentedControl
            size="xs"
            value={role}
            onChange={(value) => setRole(value as Role)}
            data={roleList.map((r) => ({ value: r, label: roles[r].label }))}
          />
        </Paper>
      </Affix>
    </Providers>
  );
}
