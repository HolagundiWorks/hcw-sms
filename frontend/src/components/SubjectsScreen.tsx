import { useState } from 'react';
import {
  Badge,
  Card,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Book, FlaskConical, Search } from 'lucide-react';
import type { Subject } from '../api/client';
import { useSubjects } from '../hooks/useSubjects';
import type { AccentColor } from '../theme';

const TYPE_COLOR: Record<string, AccentColor> = {
  Core: 'brand',
  Language: 'lavender',
  Lab: 'mint',
  Sports: 'peach',
  Activity: 'yellow',
};

function SubjectRow({ s }: { s: Subject }) {
  const color: AccentColor = (s.type && TYPE_COLOR[s.type]) || 'sky';
  return (
    <Card>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={40} radius="md" variant="light" color={color}>
            {s.is_lab ? (
              <FlaskConical size={18} strokeWidth={1.9} />
            ) : (
              <Book size={18} strokeWidth={1.9} />
            )}
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} truncate>
              {s.name}
            </Text>
            <Text size="sm" c="dimmed">
              {s.code}
            </Text>
          </div>
        </Group>
        <Group gap="lg" wrap="nowrap" visibleFrom="sm">
          {s.type && (
            <Badge variant="light" color={color}>
              {s.type}
            </Badge>
          )}
          <Text size="sm" c="dimmed">
            {s.weekly_periods}/week
          </Text>
        </Group>
      </Group>
    </Card>
  );
}

export function SubjectsScreen() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useSubjects(q);

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <div>
            <Title order={2}>Subjects</Title>
            <Text c="dimmed">{data ? `${data.total} subjects` : 'Loading…'}</Text>
          </div>
          <TextInput
            w={260}
            leftSection={<Search size={16} />}
            placeholder="Search subjects"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
          />
        </Group>

        <Stack gap="xs">
          {isLoading && !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={68} radius="lg" />
            ))
          ) : data && data.subjects.length > 0 ? (
            data.subjects.map((s) => <SubjectRow key={s.id} s={s} />)
          ) : (
            <Card>
              <Text c="dimmed" ta="center" py="xl">
                No subjects found.
              </Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
