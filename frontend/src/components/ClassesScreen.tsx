import {
  Badge,
  Card,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { DoorOpen, LayoutGrid, UserRound } from 'lucide-react';
import type { ClassRow, Section } from '../api/client';
import { useClasses } from '../hooks/useClasses';

function SectionRow({ grade, s }: { grade: string | null; s: Section }) {
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="sm"
      py={8}
      style={{ borderRadius: 8, background: 'var(--mantine-color-gray-0)' }}
    >
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <Badge variant="light" color="brand" radius="sm">
          {grade ? `${grade}–${s.name}` : s.name}
        </Badge>
        <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
          <UserRound size={14} color="var(--mantine-color-gray-5)" />
          <Text size="sm" c="dimmed" truncate>
            {s.teacher ?? 'No class teacher'}
          </Text>
        </Group>
      </Group>
      <Group gap="lg" wrap="nowrap" visibleFrom="sm">
        {s.room && (
          <Group gap={4} wrap="nowrap">
            <DoorOpen size={14} color="var(--mantine-color-gray-5)" />
            <Text size="xs" c="dimmed">
              {s.room}
            </Text>
          </Group>
        )}
        <Text size="xs" c="dimmed">
          {s.capacity != null ? `${s.capacity} seats` : ''}
        </Text>
      </Group>
    </Group>
  );
}

function ClassCard({ c }: { c: ClassRow }) {
  return (
    <Card>
      <Group justify="space-between" mb="sm">
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={38} radius="md" variant="light" color="lavender">
            <LayoutGrid size={20} strokeWidth={1.9} />
          </ThemeIcon>
          <div>
            <Text fw={650}>{c.name}</Text>
            <Text size="xs" c="dimmed">
              {c.sections.length} {c.sections.length === 1 ? 'section' : 'sections'}
            </Text>
          </div>
        </Group>
      </Group>
      <Stack gap={6}>
        {c.sections.length > 0 ? (
          c.sections.map((s) => <SectionRow key={s.id} grade={c.grade_level} s={s} />)
        ) : (
          <Text size="sm" c="dimmed">
            No sections yet.
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export function ClassesScreen() {
  const { data, isLoading } = useClasses();

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <div>
          <Title order={2}>Classes &amp; Sections</Title>
          <Text c="dimmed">{data ? `${data.total} classes` : 'Loading…'}</Text>
        </div>

        <Stack gap="md">
          {isLoading && !data ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={150} radius="lg" />)
          ) : data && data.classes.length > 0 ? (
            data.classes.map((c) => <ClassCard key={c.id} c={c} />)
          ) : (
            <Card>
              <Text c="dimmed" ta="center" py="xl">
                No classes yet.
              </Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
