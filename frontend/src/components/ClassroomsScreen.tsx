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
import { DoorOpen, FlaskConical } from 'lucide-react';
import type { Classroom } from '../api/client';
import { useClassrooms } from '../hooks/useClassrooms';
import type { AccentColor } from '../theme';

const TYPE_COLOR: Record<string, AccentColor> = {
  'Computer Lab': 'mint',
  'Science Lab': 'mint',
  Library: 'lavender',
  Auditorium: 'peach',
  Classroom: 'brand',
};

function isLab(t: string | null): boolean {
  return !!t && t.toLowerCase().includes('lab');
}

function RoomRow({ r }: { r: Classroom }) {
  const color: AccentColor = (r.room_type && TYPE_COLOR[r.room_type]) || 'sky';
  return (
    <Card>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={40} radius="md" variant="light" color={color}>
            {isLab(r.room_type) ? (
              <FlaskConical size={18} strokeWidth={1.9} />
            ) : (
              <DoorOpen size={18} strokeWidth={1.9} />
            )}
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} truncate>
              {r.name}
            </Text>
            <Text size="sm" c="dimmed">
              {r.code}
            </Text>
          </div>
        </Group>
        <Group gap="lg" wrap="nowrap" visibleFrom="sm">
          {r.room_type && (
            <Badge variant="light" color={color}>
              {r.room_type}
            </Badge>
          )}
          <Text size="sm" c="dimmed">
            {r.capacity != null ? `${r.capacity} seats` : ''}
          </Text>
        </Group>
      </Group>
    </Card>
  );
}

export function ClassroomsScreen() {
  const { data, isLoading } = useClassrooms();

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <div>
          <Title order={2}>Classrooms</Title>
          <Text c="dimmed">{data ? `${data.total} rooms` : 'Loading…'}</Text>
        </div>

        <Stack gap="xs">
          {isLoading && !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={68} radius="lg" />
            ))
          ) : data && data.classrooms.length > 0 ? (
            data.classrooms.map((r) => <RoomRow key={r.id} r={r} />)
          ) : (
            <Card>
              <Text c="dimmed" ta="center" py="xl">
                No rooms yet.
              </Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
