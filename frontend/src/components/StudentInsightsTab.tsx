import {
  Badge, Card, Group, List, Progress, RingProgress, SimpleGrid, Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Sparkles, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { fetchStudentAnalytics } from '../api/client';

const TREND = {
  improving: { icon: TrendingUp, color: 'mint' },
  declining: { icon: TrendingDown, color: 'red' },
  steady: { icon: Minus, color: 'gray' },
} as const;

const barColor = (p: number) => (p >= 75 ? 'mint' : p >= 50 ? 'sky' : p >= 33 ? 'yellow' : 'red');
const overallColor = (p: number) => (p >= 75 ? 'mint' : p >= 50 ? 'sky' : 'red');

export function StudentInsightsTab({ studentId }: { studentId: number }) {
  const token = useAuth((s) => s.token)!;
  const { data, isLoading } = useQuery({ queryKey: ['student-analytics', studentId], queryFn: () => fetchStudentAnalytics(token, studentId) });

  if (isLoading || !data) return <Text c="dimmed" ta="center" py="xl">Crunching the numbers…</Text>;
  const hasData = data.overall_pct != null;

  return (
    <Stack gap="lg">
      <Card withBorder padding="md" style={{ background: 'linear-gradient(135deg, rgba(31,58,95,0.05), rgba(154,123,31,0.06))' }}>
        <Group gap="sm" mb={6}>
          <ThemeIcon variant="light" color="brand" radius="xl"><Sparkles size={16} /></ThemeIcon>
          <Title order={5}>Auto-generated insights</Title>
          <Badge size="xs" variant="light" color="gray">derived from recorded scores</Badge>
        </Group>
        <Text size="sm">{data.summary}</Text>
      </Card>

      {hasData && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder padding="md">
              <Group>
                <RingProgress size={88} thickness={9} roundCaps
                  sections={[{ value: data.overall_pct!, color: overallColor(data.overall_pct!) }]}
                  label={<Text ta="center" fw={700} size="lg">{data.overall_pct}%</Text>} />
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Overall average</Text>
                  <Text size="sm">across {data.subjects.length} subject(s)</Text>
                </div>
              </Group>
            </Card>
            <Card withBorder padding="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>Strengths</Text>
              {data.strengths.length ? <Group gap={6}>{data.strengths.map((s) => <Badge key={s} color="mint" variant="light">{s}</Badge>)}</Group> : <Text size="sm" c="dimmed">—</Text>}
            </Card>
            <Card withBorder padding="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>Needs attention</Text>
              {data.weaknesses.length ? <Group gap={6}>{data.weaknesses.map((s) => <Badge key={s} color="red" variant="light">{s}</Badge>)}</Group> : <Text size="sm" c="dimmed">—</Text>}
            </Card>
          </SimpleGrid>

          <div>
            <Text fw={600} size="sm" mb="sm">Subject strength map</Text>
            <Stack gap="sm">
              {data.subjects.map((s) => {
                const T = TREND[s.trend];
                return (
                  <div key={s.subject}>
                    <Group justify="space-between" mb={3}>
                      <Group gap={6}>
                        <Text size="sm" fw={500}>{s.subject}</Text>
                        <Badge size="xs" variant="light" color={T.color} leftSection={<T.icon size={10} />}>{s.trend}{s.trend !== 'steady' ? ` ${s.delta > 0 ? '+' : ''}${s.delta}%` : ''}</Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{s.avg_pct}%</Text>
                    </Group>
                    <Progress value={s.avg_pct} color={barColor(s.avg_pct)} radius="sm" />
                  </div>
                );
              })}
            </Stack>
          </div>
        </>
      )}

      <Card withBorder padding="md">
        <Group gap="sm" mb={8}><ThemeIcon variant="light" color="yellow" radius="xl"><Lightbulb size={15} /></ThemeIcon><Text fw={600} size="sm">Recommendations</Text></Group>
        <List size="sm" spacing="xs">
          {data.recommendations.map((r, i) => <List.Item key={i}>{r}</List.Item>)}
        </List>
      </Card>
    </Stack>
  );
}
