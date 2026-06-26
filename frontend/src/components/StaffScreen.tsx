import { useState } from 'react';
import {
  Avatar,
  Badge,
  Card,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Search } from 'lucide-react';
import type { Staff } from '../api/client';
import { useStaff } from '../hooks/useStaff';
import { useTerms } from '../hooks/useTerms';
import { initials } from '../types';
import { accentColors, type AccentColor } from '../theme';
import type { Terms } from '../lib/institution';

function colorFor(id: number): AccentColor {
  return accentColors[id % accentColors.length];
}

function roleColor(profile: string | null): AccentColor {
  if (profile === 'admin') return 'brand';
  if (profile === 'teacher') return 'mint';
  return 'lavender';
}

function StaffRow({ s, terms }: { s: Staff; terms: Terms }) {
  const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || 'Staff';
  const secondary = s.email ?? '—';
  const roleLabel = s.profile === 'teacher' ? terms.educator : s.profile;
  return (
    <Card>
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" gap="md" style={{ minWidth: 0 }}>
          <Avatar radius="xl" color={colorFor(s.id)} variant="light">
            {initials(name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} truncate>
              {name}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {secondary}
            </Text>
          </div>
        </Group>
        <Group gap="lg" wrap="nowrap" visibleFrom="sm">
          {s.profile && (
            <Badge color={roleColor(s.profile)} variant="light" tt="capitalize">
              {roleLabel}
            </Badge>
          )}
          <Text size="sm" c="dimmed">
            {s.phone ?? ''}
          </Text>
        </Group>
      </Group>
    </Card>
  );
}

export function StaffScreen() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useStaff(q);
  const terms = useTerms();

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <div>
            <Title order={2}>Staff</Title>
            <Text c="dimmed">{data ? `${data.total} members` : 'Loading…'}</Text>
          </div>
          <TextInput
            w={260}
            leftSection={<Search size={16} />}
            placeholder="Search staff"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
          />
        </Group>

        <Stack gap="xs">
          {isLoading && !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={68} radius="lg" />
            ))
          ) : data && data.staff.length > 0 ? (
            data.staff.map((s) => <StaffRow key={s.id} s={s} terms={terms} />)
          ) : (
            <Card>
              <Text c="dimmed" ta="center" py="xl">
                No staff found.
              </Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
