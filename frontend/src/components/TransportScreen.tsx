import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bus, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { ApiError } from '../api/client';
import { useStudents } from '../hooks/useStudents';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

interface Vehicle { id: number; name: string; driver_name: string | null; driver_phone: string | null; capacity: number | null; notes: string | null; }
interface Stop { id: number; name: string; pickup_time: string | null; sort_order: number | null; }
interface Route { id: number; name: string; vehicle_id: number | null; vehicle_name: string | null; fare: number | null; notes: string | null; assigned: number; stops: Stop[]; }
interface Assignment { id: number; student_id: number; first_name: string | null; last_name: string | null; stop_id: number | null; stop_name: string | null; }

async function apiGet<T>(token: string, path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: authed(token) });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json() as Promise<T>;
}
async function postJSON(token: string, path: string, body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...authed(token), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json();
}

// ─── Vehicles tab ───────────────────────────────────────────────────────────────
function VehiclesPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', driver_name: '', driver_phone: '', capacity: '' as number | string });

  const { data, isLoading } = useQuery({ queryKey: ['transport-vehicles'], queryFn: () => apiGet<{ vehicles: Vehicle[] }>(token, '/transport/vehicles'), staleTime: 30_000 });

  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/transport/vehicles', {
      name: form.name, driver_name: form.driver_name || undefined, driver_phone: form.driver_phone || undefined,
      capacity: form.capacity === '' ? undefined : Number(form.capacity),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-vehicles'] }); setOpen(false); setForm({ name: '', driver_name: '', driver_phone: '', capacity: '' }); },
  });
  const deleteMut = useMutation({ mutationFn: (id: number) => postJSON(token, `/transport/vehicles/${id}/delete`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-vehicles'] }); qc.invalidateQueries({ queryKey: ['transport-routes'] }); } });

  const vehicles = data?.vehicles ?? [];

  return (
    <Stack gap="sm">
      <Group justify="flex-end"><Button size="xs" leftSection={<Plus size={13} />} onClick={() => setOpen(true)}>Add Vehicle</Button></Group>
      {isLoading ? <Skeleton height={120} radius="md" /> : vehicles.length === 0 ? (
        <Text size="sm" c="dimmed">No vehicles yet.</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead><Table.Tr><Table.Th>Vehicle</Table.Th><Table.Th>Driver</Table.Th><Table.Th>Phone</Table.Th><Table.Th>Capacity</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {vehicles.map((v) => (
              <Table.Tr key={v.id}>
                <Table.Td><Text size="sm" fw={500}>{v.name}</Text></Table.Td>
                <Table.Td><Text size="sm">{v.driver_name ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{v.driver_phone ?? '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{v.capacity ?? '—'}</Text></Table.Td>
                <Table.Td><Group justify="flex-end"><ActionIcon variant="subtle" color="red" onClick={() => deleteMut.mutate(v.id)}><Trash2 size={14} /></ActionIcon></Group></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={open} onClose={() => setOpen(false)} title="Add Vehicle" size="sm" radius="md">
        <Stack gap="sm">
          <TextInput label="Vehicle name / number" placeholder="e.g. Bus 4 (KA-01-AB-1234)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} data-autofocus />
          <Group grow>
            <TextInput label="Driver name" value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.currentTarget.value }))} />
            <TextInput label="Driver phone" value={form.driver_phone} onChange={(e) => setForm((f) => ({ ...f, driver_phone: e.currentTarget.value }))} />
          </Group>
          <NumberInput label="Capacity" min={0} value={form.capacity} onChange={(v) => setForm((f) => ({ ...f, capacity: v }))} />
          <Group justify="flex-end"><Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!form.name.trim()}>Add</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ─── Routes tab ─────────────────────────────────────────────────────────────────
function RoutesPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', vehicle_id: '' as string | null, fare: '' as number | string });
  const [stopFor, setStopFor] = useState<number | null>(null);
  const [stopForm, setStopForm] = useState({ name: '', pickup_time: '' });

  const { data, isLoading } = useQuery({ queryKey: ['transport-routes'], queryFn: () => apiGet<{ routes: Route[] }>(token, '/transport/routes'), staleTime: 30_000 });
  const { data: vData } = useQuery({ queryKey: ['transport-vehicles'], queryFn: () => apiGet<{ vehicles: Vehicle[] }>(token, '/transport/vehicles'), staleTime: 30_000 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['transport-routes'] });
  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/transport/routes', { name: form.name, vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined, fare: form.fare === '' ? undefined : Number(form.fare) }),
    onSuccess: () => { invalidate(); setOpen(false); setForm({ name: '', vehicle_id: null, fare: '' }); },
  });
  const deleteMut = useMutation({ mutationFn: (id: number) => postJSON(token, `/transport/routes/${id}/delete`), onSuccess: invalidate });
  const addStopMut = useMutation({
    mutationFn: () => postJSON(token, '/transport/stops', { route_id: stopFor, name: stopForm.name, pickup_time: stopForm.pickup_time || undefined }),
    onSuccess: () => { invalidate(); setStopForm({ name: '', pickup_time: '' }); setStopFor(null); },
  });
  const delStopMut = useMutation({ mutationFn: (id: number) => postJSON(token, `/transport/stops/${id}/delete`), onSuccess: invalidate });

  const routes = data?.routes ?? [];
  const vehicleOptions = (vData?.vehicles ?? []).map((v) => ({ value: String(v.id), label: v.name }));

  return (
    <Stack gap="sm">
      <Group justify="flex-end"><Button size="xs" leftSection={<Plus size={13} />} onClick={() => setOpen(true)}>Add Route</Button></Group>
      {isLoading ? <Skeleton height={140} radius="md" /> : routes.length === 0 ? (
        <Text size="sm" c="dimmed">No routes yet.</Text>
      ) : (
        <Stack gap="sm">
          {routes.map((r) => (
            <Card key={r.id} withBorder p="sm">
              <Group justify="space-between" wrap="nowrap" mb="xs">
                <Group gap="sm" wrap="nowrap">
                  <Bus size={16} color="var(--mantine-color-brand-6)" />
                  <Text fw={600}>{r.name}</Text>
                  {r.vehicle_name && <Badge variant="light" size="sm">{r.vehicle_name}</Badge>}
                  {r.fare != null && <Badge variant="light" color="mint" size="sm">₹{r.fare}</Badge>}
                  <Badge variant="light" color="gray" size="sm">{r.assigned} students</Badge>
                </Group>
                <ActionIcon variant="subtle" color="red" onClick={() => deleteMut.mutate(r.id)}><Trash2 size={14} /></ActionIcon>
              </Group>
              <Group gap={6} wrap="wrap" pl={26}>
                {r.stops.length === 0 ? <Text size="xs" c="dimmed">No stops</Text> : r.stops.map((st) => (
                  <Badge key={st.id} variant="outline" color="gray" rightSection={
                    <ActionIcon size={12} variant="transparent" color="red" onClick={() => delStopMut.mutate(st.id)}><Trash2 size={10} /></ActionIcon>
                  } leftSection={<MapPin size={10} />}>
                    {st.name}{st.pickup_time ? ` · ${st.pickup_time}` : ''}
                  </Badge>
                ))}
                <Button size="compact-xs" variant="subtle" leftSection={<Plus size={11} />} onClick={() => { setStopFor(r.id); setStopForm({ name: '', pickup_time: '' }); }}>Stop</Button>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={open} onClose={() => setOpen(false)} title="Add Route" size="sm" radius="md">
        <Stack gap="sm">
          <TextInput label="Route name" placeholder="e.g. North Loop" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} data-autofocus />
          <Select label="Vehicle" placeholder="Assign a vehicle…" data={vehicleOptions} value={form.vehicle_id} onChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))} clearable searchable />
          <NumberInput label="Fare (₹)" min={0} value={form.fare} onChange={(v) => setForm((f) => ({ ...f, fare: v }))} />
          <Group justify="flex-end"><Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!form.name.trim()}>Add</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={stopFor !== null} onClose={() => setStopFor(null)} title="Add Stop" size="sm" radius="md">
        <Stack gap="sm">
          <TextInput label="Stop name" value={stopForm.name} onChange={(e) => setStopForm((f) => ({ ...f, name: e.currentTarget.value }))} data-autofocus />
          <TextInput type="time" label="Pickup time" value={stopForm.pickup_time} onChange={(e) => setStopForm((f) => ({ ...f, pickup_time: e.currentTarget.value }))} />
          <Group justify="flex-end"><Button variant="subtle" color="gray" onClick={() => setStopFor(null)}>Cancel</Button><Button onClick={() => addStopMut.mutate()} loading={addStopMut.isPending} disabled={!stopForm.name.trim()}>Add</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ─── Assignments tab ────────────────────────────────────────────────────────────
function AssignmentsPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [routeId, setRouteId] = useState<string | null>(null);
  const [studentQ, setStudentQ] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [stopId, setStopId] = useState<string | null>(null);

  const { data: rData } = useQuery({ queryKey: ['transport-routes'], queryFn: () => apiGet<{ routes: Route[] }>(token, '/transport/routes'), staleTime: 30_000 });
  const { data: studentsData } = useStudents(studentQ);
  const { data, isLoading } = useQuery({
    queryKey: ['transport-assignments', routeId],
    queryFn: () => apiGet<{ assignments: Assignment[] }>(token, `/transport/assignments?route_id=${routeId}`),
    enabled: !!routeId,
    staleTime: 30_000,
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['transport-assignments', routeId] }); qc.invalidateQueries({ queryKey: ['transport-routes'] }); };
  const assignMut = useMutation({
    mutationFn: () => postJSON(token, '/transport/assignments', { student_id: Number(studentId), route_id: Number(routeId), stop_id: stopId ? Number(stopId) : undefined }),
    onSuccess: () => { invalidate(); setStudentId(null); setStopId(null); },
  });
  const removeMut = useMutation({ mutationFn: (id: number) => postJSON(token, `/transport/assignments/${id}/delete`), onSuccess: invalidate });

  const routes = rData?.routes ?? [];
  const routeOptions = routes.map((r) => ({ value: String(r.id), label: r.name }));
  const selectedRoute = routes.find((r) => String(r.id) === routeId);
  const stopOptions = (selectedRoute?.stops ?? []).map((s) => ({ value: String(s.id), label: s.name }));
  const studentOptions = (studentsData?.students ?? []).map((s) => ({ value: String(s.id), label: `${s.first_name ?? ''} ${s.last_name ?? ''} #${s.id}`.trim() }));
  const assignments = data?.assignments ?? [];

  return (
    <Stack gap="sm">
      <Select label="Route" placeholder="Select a route…" data={routeOptions} value={routeId} onChange={setRouteId} searchable w={280} />
      {routeId && (
        <Card withBorder p="sm">
          <Text size="sm" fw={600} mb="xs">Assign a student</Text>
          <Group align="flex-end" gap="sm" wrap="wrap">
            <Select label="Student" placeholder="Search…" data={studentOptions} value={studentId} onChange={setStudentId} searchable searchValue={studentQ} onSearchChange={setStudentQ} w={260} nothingFoundMessage="Type to search" />
            <Select label="Stop (optional)" placeholder="Stop…" data={stopOptions} value={stopId} onChange={setStopId} clearable w={180} disabled={stopOptions.length === 0} />
            <Button onClick={() => assignMut.mutate()} loading={assignMut.isPending} disabled={!studentId}>Assign</Button>
          </Group>
        </Card>
      )}

      {!routeId ? (
        <Text size="sm" c="dimmed">Select a route to manage its students.</Text>
      ) : isLoading ? (
        <Skeleton height={120} radius="md" />
      ) : assignments.length === 0 ? (
        <Text size="sm" c="dimmed">No students assigned to this route.</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead><Table.Tr><Table.Th>Student</Table.Th><Table.Th>Stop</Table.Th><Table.Th /></Table.Tr></Table.Thead>
          <Table.Tbody>
            {assignments.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td><Text size="sm">{[a.first_name, a.last_name].filter(Boolean).join(' ')}</Text></Table.Td>
                <Table.Td><Text size="sm">{a.stop_name ?? '—'}</Text></Table.Td>
                <Table.Td><Group justify="flex-end"><ActionIcon variant="subtle" color="red" onClick={() => removeMut.mutate(a.id)}><Trash2 size={14} /></ActionIcon></Group></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function TransportScreen() {
  const token = useAuth((s) => s.token)!;
  const [tab, setTab] = useState('routes');
  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group gap="sm">
          <Bus size={20} color="var(--mantine-color-brand-6)" />
          <Title order={2}>Transport</Title>
        </Group>
        <Card>
          <Tabs value={tab} onChange={(v) => setTab(v ?? 'routes')}>
            <Tabs.List mb="md">
              <Tabs.Tab value="routes" leftSection={<MapPin size={13} />}>Routes</Tabs.Tab>
              <Tabs.Tab value="vehicles" leftSection={<Bus size={13} />}>Vehicles</Tabs.Tab>
              <Tabs.Tab value="assignments" leftSection={<Users size={13} />}>Assignments</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="routes"><RoutesPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="vehicles"><VehiclesPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="assignments"><AssignmentsPanel token={token} /></Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </Container>
  );
}
