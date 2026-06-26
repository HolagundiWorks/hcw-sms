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
import { Layers } from 'lucide-react';
import { useCourses } from '../hooks/useCourses';

export function CoursesScreen() {
  const { data, isLoading } = useCourses();

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <div>
          <Title order={2}>Courses</Title>
          <Text c="dimmed">{data ? `${data.total} courses` : 'Loading…'}</Text>
        </div>

        <Stack gap="xs">
          {isLoading && !data ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={64} radius="lg" />
            ))
          ) : data && data.courses.length > 0 ? (
            data.courses.map((c) => (
              <Card key={c.id}>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size={40} radius="md" variant="light" color="brand">
                      <Layers size={20} strokeWidth={1.9} />
                    </ThemeIcon>
                    <Text fw={600} truncate>
                      {c.name}
                    </Text>
                  </Group>
                  <Badge variant="light" color="sky">
                    {c.subjects} subjects
                  </Badge>
                </Group>
              </Card>
            ))
          ) : (
            <Card>
              <Text c="dimmed" ta="center" py="xl">
                No courses yet.
              </Text>
            </Card>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
