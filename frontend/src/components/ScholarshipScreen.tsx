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
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Trash2 } from 'lucide-react';
import { ApiError } from '../api/client';
import { useStudents } from '../hooks/useStudents';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

interface Scholarship {
  id: number;
  student_id: number;
  first_name: string | null;
  last_name: string | null;
  name: string;
  kind: string | null;
  value: number;
  notes: string | null;
  awarded_date: string | null;
}

const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
async function apiGet(token: string): Promise<{ scholarships: Scholarship[] }> {
  const r = await fetch(`${BASE}/scholarships`, { headers: authed(token) });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json();
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

const fmtValue = (s: Scholarship) => (s.kind === 'percent' ? `${s.value}%` : `₹${(s.value ?? 0).toLocaleString('en-IN')}`);

const blank = { student_id: '' as string | null, name: '', kind: 'amount', value: 0 as number | string, notes: '' };

export function ScholarshipScreen() {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [studentQ, setStudentQ] = useState('');
  const { data: studentsData } = useStudents(studentQ);

  const { data, isLoading } = useQuery({ queryKey: ['scholarships'], queryFn: () => apiGet(token), staleTime: 30_000 });

  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/scholarships', {
      student_id: Number(form.student_id), name: form.name, kind: form.kind,
      value: Number(form.value) || 0, notes: form.notes || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scholarships'] }); setOpen(false); setForm(blank); },
  });
  const deleteMut = useMutation({ mutationFn: (id: number) => postJSON(token, `/scholarships/${id}/delete`), onSuccess: () => qc.invalidateQueries({ queryKey: ['scholarships'] }) });

  const rows = data?.scholarships ?? [];
  const studentOptions = (studentsData?.students ?? []).map((s) => ({ value: String(s.id), label: `${s.first_name ?? ''} ${s.last_name ?? ''} #${s.id}`.trim() }));

  return (
    <Container size="lg" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <div>
            <Group gap="sm"><Award size={20} color="var(--mantine-color-brand-6)" /><Title order={2}>Scholarships</Title></Group>
            <Text c="dimmed" size="sm">Record fee concessions &amp; scholarships awarded to students</Text>
          </div>
          <Button leftSection={<Plus size={15} />} onClick={() => setOpen(true)}>Award Scholarship</Button>
        </Group>

        <Card>
          {isLoading ? <Skeleton height={180} radius="md" /> : rows.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">No scholarships awarded yet.</Text>
          ) : (
            <Table withTableBorder striped>
              <Table.Thead>
                <Table.Tr><Table.Th>Student</Table.Th><Table.Th>Scholarship</Table.Th><Table.Th>Concession</Table.Th><Table.Th>Awarded</Table.Th><Table.Th /></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td><Text size="sm" fw={500}>{[s.first_name, s.last_name].filter(Boolean).join(' ')}</Text></Table.Td>
                    <Table.Td>
                      <Text size="sm">{s.name}</Text>
                      {s.notes && <Text size="xs" c="dimmed" lineClamp={1}>{s.notes}</Text>}
                    </Table.Td>
                    <Table.Td><Badge variant="light" color="mint">{fmtValue(s)}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{s.awarded_date ?? '—'}</Text></Table.Td>
                    <Table.Td><Group justify="flex-end"><ActionIcon variant="subtle" color="red" onClick={() => deleteMut.mutate(s.id)}><Trash2 size={14} /></ActionIcon></Group></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>

      <Modal opened={open} onClose={() => setOpen(false)} title="Award Scholarship" size="sm" radius="md">
        <Stack gap="sm">
          <Select label="Student" placeholder="Search…" data={studentOptions} value={form.student_id} onChange={(v) => setForm((f) => ({ ...f, student_id: v }))} searchable searchValue={studentQ} onSearchChange={setStudentQ} nothingFoundMessage="Type to search" data-autofocus />
          <TextInput label="Scholarship name" placeholder="e.g. Merit / Sibling / Staff ward" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} />
          <Group grow>
            <Select label="Type" data={[{ value: 'amount', label: 'Fixed amount (₹)' }, { value: 'percent', label: 'Percentage (%)' }]} value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v ?? 'amount' }))} allowDeselect={false} />
            <NumberInput label={form.kind === 'percent' ? 'Percent' : 'Amount'} min={0} value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} />
          </Group>
          <Textarea label="Notes" autosize minRows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.currentTarget.value }))} />
          <Group justify="flex-end"><Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!form.student_id || !form.name.trim()}>Award</Button></Group>
        </Stack>
      </Modal>
    </Container>
  );
}
