import { useState } from 'react';
import {
  Avatar,
  Badge,
  Card,
  Container,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import {
  IconBook2,
  IconClipboardCheck,
  IconMessages,
  IconUsers,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { IconComponent } from '../icons';
import type { AccentColor } from '../theme';
import type { SessionUser } from '../types';
import { AppShellLayout } from './AppShellLayout';

interface Stat {
  label: string;
  value: string;
  icon: IconComponent;
  color: AccentColor;
}

const stats: Stat[] = [
  { label: 'Students', value: '482', icon: IconUsers, color: 'brand' },
  { label: 'Attendance today', value: '96%', icon: IconClipboardCheck, color: 'mint' },
  { label: 'Classes today', value: '6', icon: IconBook2, color: 'peach' },
  { label: 'Unread messages', value: '3', icon: IconMessages, color: 'lavender' },
];

interface AgendaItem {
  time: string;
  title: string;
  who: string;
  color: AccentColor;
}

const agenda: AgendaItem[] = [
  { time: '08:30', title: 'Grade 9 — Mathematics', who: 'Ms. Anika Rao', color: 'brand' },
  { time: '10:00', title: 'Grade 10 — Biology', who: 'Mr. David Lee', color: 'mint' },
  { time: '11:30', title: 'Staff sync', who: 'Faculty room', color: 'peach' },
  { time: '14:00', title: 'Parent meeting — Sharma', who: 'Office 2', color: 'lavender' },
];

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  return (
    <Card>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            {stat.label}
          </Text>
          <Text fz={28} fw={700} lh={1.2}>
            {stat.value}
          </Text>
        </div>
        <ThemeIcon size={48} radius="lg" variant="light" color={stat.color}>
          <Icon size={26} stroke={1.6} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <Group
      wrap="nowrap"
      gap="md"
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        borderLeft: `4px solid var(--mantine-color-${item.color}-5)`,
        background: 'var(--mantine-color-gray-0)',
      }}
    >
      <Text fw={700} c={item.color} w={48} style={{ flexShrink: 0 }}>
        {item.time}
      </Text>
      <Avatar radius="xl" color={item.color} variant="light" size="md">
        {item.who.split(' ').map((p) => p[0]).slice(0, 2).join('')}
      </Avatar>
      <div style={{ minWidth: 0 }}>
        <Text fw={600} truncate>
          {item.title}
        </Text>
        <Text size="sm" c="dimmed" truncate>
          {item.who}
        </Text>
      </div>
    </Group>
  );
}

/** Calendar-first dashboard — the default landing screen for every role. */
export function DashboardPage({ user }: { user: SessionUser }) {
  const [selected, setSelected] = useState<Date>(new Date());

  return (
    <AppShellLayout user={user}>
      <Container size="xl" px={0}>
        <Stack gap="lg">
          <div>
            <Title order={2}>Good morning, {user.name.split(' ')[0]} 👋</Title>
            <Text c="dimmed">
              {dayjs().format('dddd, D MMMM YYYY')} · here's your day at a glance.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </SimpleGrid>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card h="100%">
                <Group justify="space-between" mb="sm">
                  <Text fw={650}>Calendar</Text>
                  <Badge variant="light" color="brand">
                    {dayjs(selected).format('MMM D')}
                  </Badge>
                </Group>
                <Calendar
                  size="md"
                  getDayProps={(date) => ({
                    selected: dayjs(date).isSame(selected, 'day'),
                    onClick: () => setSelected(date),
                  })}
                />
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card h="100%">
                <Group justify="space-between" mb="md">
                  <Text fw={650}>Today's schedule</Text>
                  <Badge variant="light" color="mint">
                    {agenda.length} events
                  </Badge>
                </Group>
                <Stack gap="xs">
                  {agenda.map((item) => (
                    <AgendaRow key={item.time} item={item} />
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </AppShellLayout>
  );
}
