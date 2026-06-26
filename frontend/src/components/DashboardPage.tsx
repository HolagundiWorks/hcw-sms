import { useState } from 'react';
import {
  Badge,
  Card,
  Container,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, CalendarHeart, ChevronRight, CircleAlert, GraduationCap, Info, Layers, PartyPopper, Sparkles, UserCheck, Users, Wallet } from 'lucide-react';
import dayjs from 'dayjs';
import type { IconComponent } from '../icons';
import type { AccentColor } from '../theme';
import { ApiError, type WorkItem } from '../api/client';
import { useDashboardToday } from '../hooks/useDashboardToday';
import { useAuth } from '../stores/auth';
import { EventFab } from './EventFab';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// ─── Stat card data ────────────────────────────────────────────────────────────
interface DashStats { students: number; staff: number; sections: number; pending_fees: number; }
interface MeetingToday { id: number; title: string; meeting_type: string | null; start_time: string | null; end_time: string | null; venue: string | null; status: string | null; }

// ─── Agenda (categorised upcoming meetings + events) ────────────────────────────
interface AgendaItem { id: number; title: string; date: string | null; start_time?: string | null; venue: string | null; }
interface AgendaData { department: AgendaItem[]; staff: AgendaItem[]; parent: AgendaItem[]; events: AgendaItem[]; }

const SEV: Record<WorkItem['severity'], { color: AccentColor; Icon: IconComponent }> = {
  danger: { color: 'peach', Icon: CircleAlert },
  warning: { color: 'yellow', Icon: AlertTriangle },
  info: { color: 'sky', Icon: Info },
};

function WorkRow({ item, onNavigate }: { item: WorkItem; onNavigate: (m: string) => void }) {
  const s = SEV[item.severity] ?? SEV.info;
  const Icon = s.Icon;
  return (
    <UnstyledButton
      onClick={() => onNavigate(item.module)}
      p="sm"
      style={{ borderRadius: 'var(--mantine-radius-md)', width: '100%' }}
    >
      <Group wrap="nowrap" gap="md">
        <ThemeIcon variant="light" color={s.color} radius="md" size={34}>
          <Icon size={18} strokeWidth={2} />
        </ThemeIcon>
        {item.count > 0 && (
          <Badge color={s.color} variant="light" radius="sm">{item.count}</Badge>
        )}
        <Text style={{ flex: 1 }} fw={500}>{item.label}</Text>
        <ChevronRight size={18} color="var(--mantine-color-gray-5)" />
      </Group>
    </UnstyledButton>
  );
}

// ─── Stat cards ────────────────────────────────────────────────────────────────
const STAT_DEFS = [
  { key: 'students', label: 'Students', Icon: GraduationCap, color: 'brand' as AccentColor, module: 'students' },
  { key: 'staff', label: 'Staff', Icon: Users, color: 'mint' as AccentColor, module: 'staff' },
  { key: 'sections', label: 'Sections', Icon: Layers, color: 'lavender' as AccentColor, module: 'classes' },
  { key: 'pending_fees', label: 'Fee Outstanding', Icon: Wallet, color: 'peach' as AccentColor, module: 'fees' },
];

function StatCards({ stats, onNavigate }: { stats: DashStats; onNavigate: (m: string) => void }) {
  return (
    <Grid gutter="sm">
      {STAT_DEFS.map((def) => (
        <Grid.Col key={def.key} span={{ base: 6, sm: 3 }}>
          <UnstyledButton onClick={() => onNavigate(def.module)} style={{ width: '100%' }}>
            <Card p="md" style={{ borderTop: `3px solid var(--mantine-color-${def.color}-5)` }}>
              <Group wrap="nowrap" justify="space-between">
                <Stack gap={0}>
                  <Text size="xl" fw={700}>{stats[def.key as keyof DashStats].toLocaleString()}</Text>
                  <Text size="xs" c="dimmed">{def.label}</Text>
                </Stack>
                <ThemeIcon variant="light" color={def.color} size={40} radius="md">
                  <def.Icon size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </UnstyledButton>
        </Grid.Col>
      ))}
    </Grid>
  );
}

// ─── Meetings today widget ─────────────────────────────────────────────────────
function MeetingsTodayCard({ meetings }: { meetings: MeetingToday[] }) {
  if (meetings.length === 0) return null;
  return (
    <Card>
      <Text fw={650} mb="sm">Today's Meetings</Text>
      <Stack gap="xs">
        {meetings.map((m) => (
          <Group key={m.id} gap="md" p="xs" style={{ borderLeft: '3px solid var(--mantine-color-brand-5)', background: 'var(--mantine-color-gray-0)', borderRadius: 6 }}>
            <Text fw={700} c="brand" w={48} style={{ flexShrink: 0, fontSize: '0.8rem' }}>{m.start_time ?? '—'}</Text>
            <div style={{ minWidth: 0 }}>
              <Text fw={600} truncate size="sm">{m.title}</Text>
              <Text size="xs" c="dimmed">{m.venue ?? m.meeting_type}</Text>
            </div>
            <Badge size="xs" ml="auto" variant="outline">{m.meeting_type}</Badge>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

// ─── Agenda card (one category) ─────────────────────────────────────────────────
function AgendaCard({
  label, Icon, color, items, onNavigate,
}: { label: string; Icon: IconComponent; color: AccentColor; items: AgendaItem[]; onNavigate: (m: string) => void }) {
  return (
    <Card p="md" style={{ height: '100%' }}>
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap={8} wrap="nowrap">
          <ThemeIcon variant="light" color={color} radius="md" size={30}>
            <Icon size={16} strokeWidth={2} />
          </ThemeIcon>
          <Text fw={650} size="sm">{label}</Text>
        </Group>
        {items.length > 0 && <Badge variant="light" color={color} radius="sm">{items.length}</Badge>}
      </Group>
      {items.length === 0 ? (
        <Text size="xs" c="dimmed" py="sm">None scheduled.</Text>
      ) : (
        <Stack gap={6}>
          {items.slice(0, 4).map((it) => (
            <Group key={it.id} gap="xs" wrap="nowrap" align="flex-start">
              <Text fw={700} c={color} style={{ fontSize: '0.7rem', flexShrink: 0, width: 52 }}>
                {it.date ? dayjs(it.date).format('MMM D') : '—'}
              </Text>
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>{it.title}</Text>
                <Text size="xs" c="dimmed" truncate>
                  {[it.start_time, it.venue].filter(Boolean).join(' · ') || '—'}
                </Text>
              </div>
            </Group>
          ))}
        </Stack>
      )}
      <UnstyledButton onClick={() => onNavigate('events')} mt="sm">
        <Group gap={2}><Text size="xs" c={color} fw={500}>Open</Text><ChevronRight size={13} /></Group>
      </UnstyledButton>
    </Card>
  );
}

// ─── Agenda section (4 category cards) ──────────────────────────────────────────
function AgendaSection({ token, onNavigate }: { token: string; onNavigate: (m: string) => void }) {
  const { data } = useQuery<AgendaData>({
    queryKey: ['dashboard-agenda'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/dashboard/agenda`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
      return r.json() as Promise<AgendaData>;
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  const agenda: AgendaData = data && Array.isArray(data.staff)
    ? data
    : { department: [], staff: [], parent: [], events: [] };

  return (
    <Grid gutter="sm">
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <AgendaCard label="Department Meetings" Icon={Building2} color="lavender" items={agenda.department} onNavigate={onNavigate} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <AgendaCard label="Staff Meetings" Icon={Users} color="brand" items={agenda.staff} onNavigate={onNavigate} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <AgendaCard label="Parent Meetings" Icon={UserCheck} color="mint" items={agenda.parent} onNavigate={onNavigate} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
        <AgendaCard label="Upcoming Events" Icon={CalendarHeart} color="peach" items={agenda.events} onNavigate={onNavigate} />
      </Grid.Col>
    </Grid>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export function DashboardScreen({ onNavigate }: { onNavigate: (module: string) => void }) {
  const token = useAuth((s) => s.token);
  const [selected, setSelected] = useState<Date>(new Date());
  const { data: todayData, isLoading: loadingToday } = useDashboardToday();
  const items = todayData ?? [];

  const { data: statsData } = useQuery<DashStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
      return r.json() as Promise<DashStats>;
    },
    enabled: !!token,
    staleTime: 120_000,
  });

  const { data: meetingsData } = useQuery<{ meetings: MeetingToday[] }>({
    queryKey: ['dashboard-meetings-today'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/dashboard/meetings-today`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
      return r.json() as Promise<{ meetings: MeetingToday[] }>;
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        {/* Stat cards */}
        {statsData && typeof statsData.students === 'number' ? (
          <StatCards stats={statsData} onNavigate={onNavigate} />
        ) : (
          <Grid gutter="sm">
            {Array.from({ length: 4 }).map((_, i) => <Grid.Col key={i} span={{ base: 6, sm: 3 }}><Skeleton height={76} radius="md" /></Grid.Col>)}
          </Grid>
        )}

        {/* Needs-attention work queue */}
        <Card>
          <Group justify="space-between" mb="xs">
            <Text fw={650}>Today</Text>
            {items.length > 0 && <Badge variant="light" color="yellow">{items.length} to act on</Badge>}
          </Group>
          {loadingToday ? (
            <Stack gap={6}>
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={50} radius="md" />)}
            </Stack>
          ) : items.length === 0 ? (
            <Group justify="center" py="lg" gap="xs" c="dimmed">
              <PartyPopper size={18} />
              <Text>You're all caught up.</Text>
            </Group>
          ) : (
            <Stack gap={2}>
              {items.map((it) => <WorkRow key={it.key} item={it} onNavigate={onNavigate} />)}
            </Stack>
          )}
        </Card>

        {/* Meetings today */}
        {meetingsData && (meetingsData.meetings?.length ?? 0) > 0 && (
          <MeetingsTodayCard meetings={meetingsData.meetings} />
        )}

        {/* Categorised agenda: department / staff / parent meetings + events */}
        <div>
          <Group gap="xs" mb="sm">
            <Sparkles size={16} color="var(--mantine-color-brand-6)" />
            <Text fw={650}>Meetings &amp; Events</Text>
          </Group>
          {token && <AgendaSection token={token} onNavigate={onNavigate} />}
        </div>

        {/* Calendar */}
        <Card>
          <Group justify="space-between" mb="sm">
            <Text fw={650}>Calendar</Text>
            <Badge variant="light" color="brand">{dayjs(selected).format('MMM D')}</Badge>
          </Group>
          <Calendar
            size="md"
            getDayProps={(date) => ({
              selected: dayjs(date).isSame(selected, 'day'),
              onClick: () => setSelected(date),
            })}
          />
        </Card>
      </Stack>

      {/* Floating create-event button (bottom-right) */}
      <EventFab />
    </Container>
  );
}
