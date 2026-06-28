import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Avatar,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Flag, Medal, Plus, Trash2, Trophy } from 'lucide-react';
import { useAuth } from '../stores/auth';
import {
  createSportsEvent, createSportsResult, deleteSportsEvent, deleteSportsResult,
  fetchClubs, fetchLeaderboard, fetchSportsEvents, fetchSportsResults, type SportsEvent,
} from '../api/client';

const POINTS_FOR = (pos: number) => (pos === 1 ? 10 : pos === 2 ? 5 : pos === 3 ? 3 : pos ? 1 : 0);
const MEDAL = ['#d4af37', '#9ca3af', '#cd7f32']; // gold / silver / bronze

// ─── Schedule ─────────────────────────────────────────────────────────────────
function SchedulePanel({ token, onPickEvent }: { token: string; onPickEvent: (e: SportsEvent) => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['sports-events'], queryFn: () => fetchSportsEvents(token) });
  const { data: clubsData } = useQuery({ queryKey: ['clubs'], queryFn: () => fetchClubs(token) });
  const clubOptions = (clubsData?.clubs ?? []).map((c) => ({ value: String(c.id), label: c.name ?? `Club ${c.id}` }));
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [homeClub, setHomeClub] = useState<string | null>(null);
  const [awayClub, setAwayClub] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createSportsEvent(token, {
      name, sport, event_date: date, event_time: time, venue,
      home_club_id: homeClub ? Number(homeClub) : null,
      away_club_id: awayClub ? Number(awayClub) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports-events'] }); setName(''); setSport(''); setVenue(''); setHomeClub(null); setAwayClub(null); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteSportsEvent(token, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports-events'] }); qc.invalidateQueries({ queryKey: ['sports-leaderboard'] }); },
  });

  return (
    <Stack gap="md">
      <Card withBorder>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          <TextInput label="Match / event" placeholder="Football — Quarter Final" value={name} onChange={(e) => setName(e.currentTarget.value)} required data-testid="sports-event-name" />
          <TextInput label="Sport" placeholder="Football" value={sport} onChange={(e) => setSport(e.currentTarget.value)} />
          <TextInput label="Venue" placeholder="Main Ground" value={venue} onChange={(e) => setVenue(e.currentTarget.value)} />
          <Select label="Home club" placeholder="Select club" data={clubOptions} value={homeClub} onChange={setHomeClub} searchable clearable data-testid="sports-home-club" />
          <Select label="Away club" placeholder="Select club" data={clubOptions} value={awayClub} onChange={setAwayClub} searchable clearable data-testid="sports-away-club" />
          <Group grow>
            <TextInput label="Date" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
            <TextInput label="Time" type="time" value={time} onChange={(e) => setTime(e.currentTarget.value)} />
          </Group>
          <Group align="flex-end"><Button leftSection={<Plus size={15} />} loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()} data-testid="sports-event-add">Schedule match</Button></Group>
        </SimpleGrid>
      </Card>

      {data && data.events.length > 0 ? (
        <Table withTableBorder striped>
          <Table.Thead><Table.Tr><Table.Th>Date</Table.Th><Table.Th>Event</Table.Th><Table.Th>Sport</Table.Th><Table.Th>Venue</Table.Th><Table.Th>Results</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {data.events.map((e) => (
              <Table.Tr key={e.id} data-testid="sports-event-row">
                <Table.Td><Text size="xs">{e.event_date} {e.event_time}</Text></Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>{e.name}</Text>
                  {(e.home_club || e.away_club) && (
                    <Text size="xs" c="dimmed">{e.home_club ?? 'TBD'} <Text span c="brand" fw={600}>vs</Text> {e.away_club ?? 'TBD'}</Text>
                  )}
                </Table.Td>
                <Table.Td><Text size="sm">{e.sport ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="xs" c="dimmed">{e.venue ?? '—'}</Text></Table.Td>
                <Table.Td><Badge size="xs" variant="light">{e.result_count}</Badge></Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Button size="compact-xs" variant="subtle" onClick={() => onPickEvent(e)} data-testid="sports-event-results">Results</Button>
                    <ActionIcon size="sm" variant="subtle" color="red" onClick={() => del.mutate(e.id)}><Trash2 size={13} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : <Text size="sm" c="dimmed">No events scheduled.</Text>}
    </Stack>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function ResultsPanel({ token, event }: { token: string; event: SportsEvent | null }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['sports-results', event?.id],
    queryFn: () => fetchSportsResults(token, event!.id),
    enabled: !!event,
  });
  const { data: clubsData } = useQuery({ queryKey: ['clubs'], queryFn: () => fetchClubs(token) });
  // Default the club picker to the two clubs in this match, else all clubs.
  const matchClubs = [event?.home_club_id, event?.away_club_id].filter(Boolean) as number[];
  const allClubs = clubsData?.clubs ?? [];
  const clubOptions = (matchClubs.length ? allClubs.filter((c) => matchClubs.includes(c.id)) : allClubs)
    .map((c) => ({ value: String(c.id), label: c.name ?? `Club ${c.id}` }));
  const [participant, setParticipant] = useState('');
  const [club, setClub] = useState<string | null>(null);
  const [position, setPosition] = useState<number | string>(1);
  const [points, setPoints] = useState<number | string>(10);

  const add = useMutation({
    mutationFn: () => createSportsResult(token, { event_id: event!.id, participant, club_id: club ? Number(club) : null, position: Number(position) || null, points: Number(points) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports-results', event!.id] }); qc.invalidateQueries({ queryKey: ['sports-leaderboard'] }); qc.invalidateQueries({ queryKey: ['sports-events'] }); setParticipant(''); setClub(null); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteSportsResult(token, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports-results', event!.id] }); qc.invalidateQueries({ queryKey: ['sports-leaderboard'] }); },
  });

  if (!event) return <Text size="sm" c="dimmed">Pick an event from the Schedule tab to record results.</Text>;

  return (
    <Stack gap="md">
      <Text fw={600}>{event.name} <Text span c="dimmed" size="sm">· {event.sport ?? 'Sport'} · {event.event_date}</Text></Text>
      <Card withBorder>
        <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="sm">
          <Select label="Club" placeholder="Select club" data={clubOptions} value={club} onChange={setClub} searchable data-testid="sports-result-club" />
          <TextInput label="Participant / player" value={participant} onChange={(e) => setParticipant(e.currentTarget.value)} required data-testid="sports-result-participant" />
          <NumberInput label="Position" min={1} value={position} onChange={(v) => { setPosition(v); setPoints(POINTS_FOR(Number(v))); }} data-testid="sports-result-position" />
          <NumberInput label="Points" min={0} value={points} onChange={setPoints} data-testid="sports-result-points" />
          <Group align="flex-end"><Button leftSection={<Plus size={15} />} loading={add.isPending} disabled={!participant.trim()} onClick={() => add.mutate()} data-testid="sports-result-add">Record</Button></Group>
        </SimpleGrid>
      </Card>

      {data && data.results.length > 0 ? (
        <Table withTableBorder striped>
          <Table.Thead><Table.Tr><Table.Th>Pos</Table.Th><Table.Th>Participant</Table.Th><Table.Th>Club</Table.Th><Table.Th>Points</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {data.results.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td><Badge color="gray" variant="light">{r.position ?? '—'}</Badge></Table.Td>
                <Table.Td>{r.participant}</Table.Td>
                <Table.Td>{r.club ? <Badge variant="light">{r.club}</Badge> : '—'}</Table.Td>
                <Table.Td><Text fw={600}>{r.points}</Text></Table.Td>
                <Table.Td><ActionIcon size="sm" variant="subtle" color="red" onClick={() => del.mutate(r.id)}><Trash2 size={13} /></ActionIcon></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : <Text size="sm" c="dimmed">No results recorded for this event.</Text>}
    </Stack>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardPanel({ token }: { token: string }) {
  const { data } = useQuery({ queryKey: ['sports-leaderboard'], queryFn: () => fetchLeaderboard(token) });
  const clubs = data?.clubs ?? [];
  const participants = data?.participants ?? [];

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      <Card withBorder data-testid="leaderboard-clubs">
        <Group gap="sm" mb="sm"><Trophy size={18} color="#d4af37" /><Text fw={700}>Club Standings</Text></Group>
        {clubs.length > 0 ? (
          <Stack gap="xs">
            {clubs.map((h, i) => (
              <Group key={h.club_id} justify="space-between" px="sm" py="xs" style={{ borderRadius: 8, background: i === 0 ? 'rgba(212,175,55,0.12)' : 'var(--mantine-color-gray-0)' }}>
                <Group gap="sm">
                  <ThemeIcon size={28} radius="xl" variant="light" color={i < 3 ? 'yellow' : 'gray'} style={i < 3 ? { color: MEDAL[i] } : undefined}>
                    {i < 3 ? <Medal size={16} /> : <Text size="sm" fw={700}>{i + 1}</Text>}
                  </ThemeIcon>
                  <Avatar src={h.logo ?? undefined} size={26} radius="md" color="brand">{(h.club ?? '?').slice(0, 2)}</Avatar>
                  <Text fw={600}>{h.club}</Text>
                </Group>
                <Group gap="lg"><Text size="xs" c="dimmed">{h.entries} entries</Text><Text fw={700} size="lg">{h.points}</Text></Group>
              </Group>
            ))}
          </Stack>
        ) : <Text size="sm" c="dimmed">No points yet — record results with a club to populate the leaderboard.</Text>}
      </Card>

      <Card withBorder data-testid="leaderboard-participants">
        <Group gap="sm" mb="sm"><Flag size={18} color="var(--mantine-color-brand-6)" /><Text fw={700}>Top Performers</Text></Group>
        {participants.length > 0 ? (
          <Table>
            <Table.Thead><Table.Tr><Table.Th>#</Table.Th><Table.Th>Participant</Table.Th><Table.Th>Points</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {participants.map((p, i) => (
                <Table.Tr key={p.participant}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{p.participant}</Table.Td>
                  <Table.Td><Text fw={600}>{p.points}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : <Text size="sm" c="dimmed">No results yet.</Text>}
      </Card>
    </SimpleGrid>
  );
}

export function SportsScreen() {
  const token = useAuth((s) => s.token)!;
  const [tab, setTab] = useState('schedule');
  const [event, setEvent] = useState<SportsEvent | null>(null);

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group gap="sm"><Trophy size={20} color="var(--mantine-color-brand-6)" /><Title order={2}>Sports</Title></Group>
        <Tabs value={tab} onChange={(v) => setTab(v ?? 'schedule')}>
          <Tabs.List mb="md">
            <Tabs.Tab value="schedule" leftSection={<CalendarDays size={14} />}>Schedule</Tabs.Tab>
            <Tabs.Tab value="results" leftSection={<Medal size={14} />}>Results</Tabs.Tab>
            <Tabs.Tab value="leaderboard" leftSection={<Trophy size={14} />}>Leaderboard</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="schedule"><SchedulePanel token={token} onPickEvent={(e) => { setEvent(e); setTab('results'); }} /></Tabs.Panel>
          <Tabs.Panel value="results"><ResultsPanel token={token} event={event} /></Tabs.Panel>
          <Tabs.Panel value="leaderboard"><LeaderboardPanel token={token} /></Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
