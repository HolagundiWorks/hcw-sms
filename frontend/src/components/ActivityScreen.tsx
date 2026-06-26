import { useMemo, useState } from 'react';
import {
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
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bus, FileText, Plus, Trash2 } from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import { useClasses } from '../hooks/useClasses';
import { useSchool } from '../hooks/useSchool';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Activity {
  id: number;
  title: string;
  activity_type: string | null;
  date: string | null;
  end_date: string | null;
  venue: string | null;
  description: string | null;
  status: string | null;
}

interface ActivityDetail {
  activity: Activity;
  staff: { staff_id: number; name: string; role: string | null }[];
  sections: { section_id: number; section_name: string | null; class_name: string | null; student_count: number | null }[];
  expenses: { id: number; head: string; amount: number; notes: string | null }[];
  total_expense: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

async function postJSON(token: string, path: string, body: object) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...authed(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

async function apiActivities(token: string, status?: string): Promise<{ activities: Activity[] }> {
  const qs = status ? `?status=${status}` : '';
  return fetch(`${BASE}/activities${qs}`, { headers: authed(token) }).then((r) => r.json());
}

async function apiActivityDetail(token: string, id: number): Promise<ActivityDetail> {
  return fetch(`${BASE}/activities/${id}/detail`, { headers: authed(token) }).then((r) => r.json());
}

const ACTIVITY_TYPES = ['field_visit', 'trip', 'sports_day', 'workshop', 'cultural', 'picnic', 'other'];
const STATUSES = ['planned', 'confirmed', 'completed', 'cancelled'];

function statusColor(s: string | null) {
  if (s === 'confirmed') return 'brand';
  if (s === 'completed') return 'mint';
  if (s === 'cancelled') return 'gray';
  return 'yellow';
}

// ─── Field Guide print ────────────────────────────────────────────────────────
function printFieldGuide(detail: ActivityDetail, schoolName: string) {
  const { activity: a, staff, sections, expenses, total_expense } = detail;
  const staffList = staff.map((s) => `<li>${s.name} — <em>${s.role ?? 'Staff'}</em></li>`).join('');
  const sectionList = sections.map((s) => `<li>${s.class_name} · ${s.section_name} (${s.student_count ?? '?'} students)</li>`).join('');
  const expList = expenses.map((e) => `<tr><td>${e.head}</td><td>₹${e.amount.toLocaleString()}</td><td>${e.notes ?? ''}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><title>Field Guide — ${a.title}</title>
<style>
body{font-family:'Segoe UI',sans-serif;max-width:720px;margin:40px auto;font-size:0.9rem;}
h1{font-size:1.4rem;margin-bottom:4px;}h2{font-size:1rem;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:24px;}
table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:5px 8px;}
.meta{color:#555;font-size:0.8rem;margin-bottom:20px;}
.checklist li{margin:4px 0;}
.total{font-weight:700;}
.slip{border:1px dashed #aaa;padding:12px;margin-top:24px;page-break-inside:avoid;}
@media print{body{margin:10mm;}}
</style></head>
<body>
<h1>${a.title}</h1>
<div class="meta">
  ${schoolName} &nbsp;|&nbsp; ${a.activity_type ?? 'Activity'} &nbsp;|&nbsp;
  Date: <strong>${a.date ?? '—'}${a.end_date && a.end_date !== a.date ? ' to ' + a.end_date : ''}</strong>
  ${a.venue ? '&nbsp;|&nbsp; Venue: <strong>' + a.venue + '</strong>' : ''}
</div>

<h2>Description</h2>
<p>${a.description ?? '—'}</p>

<h2>Staff In-Charge</h2>
<ul>${staffList || '<li>—</li>'}</ul>

<h2>Participating Sections</h2>
<ul>${sectionList || '<li>—</li>'}</ul>

<h2>Expense Estimate</h2>
<table>
<thead><tr><th>Head</th><th>Amount</th><th>Notes</th></tr></thead>
<tbody>${expList}<tr class="total"><td colspan="2"><strong>Total</strong></td><td>₹${total_expense.toLocaleString()}</td></tr></tbody>
</table>

<h2>Checklist</h2>
<ul class="checklist">
<li>☐ Parent permission slips collected</li>
<li>☐ Transport arranged</li>
<li>☐ First aid kit packed</li>
<li>☐ Attendance register ready</li>
<li>☐ Emergency contact list with each staff</li>
<li>☐ School ID cards for all students</li>
</ul>

<div class="slip">
<strong>Parent Permission Slip — Please return by ${a.date ?? '——'}</strong><br/>
I permit my child _______________________________ of Class ______ to attend the ${a.title}
on ${a.date ?? '—'}.<br/><br/>
Parent Name: ______________________ &nbsp; Signature: ______________________ &nbsp; Date: __________
</div>

<p style="font-size:0.7rem;color:#aaa;margin-top:24px;">Generated by LEOS · ${new Date().toLocaleDateString()}</p>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ─── Activity detail panel (right side) ───────────────────────────────────────
function ActivityDetailPanel({ token, activityId, schoolName }: { token: string; activityId: number; schoolName: string }) {
  const qc = useQueryClient();
  const { data: staffData } = useStaff('');
  const { data: classesData } = useClasses();
  const [addStaffId, setAddStaffId] = useState<string | null>(null);
  const [addStaffRole, setAddStaffRole] = useState('in_charge');
  const [addSectionId, setAddSectionId] = useState<string | null>(null);
  const [addStudentCount, setAddStudentCount] = useState<number | string>(0);
  const [expForm, setExpForm] = useState({ head: '', amount: 0 as number | string, notes: '' });
  const [statusUpdate, setStatusUpdate] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['activity-detail', activityId],
    queryFn: () => apiActivityDetail(token, activityId),
    enabled: !!activityId,
    staleTime: 30_000,
  });

  const addStaffMut = useMutation({
    mutationFn: () => postJSON(token, '/activity-staff', { activity_id: activityId, staff_id: Number(addStaffId), role: addStaffRole }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }); setAddStaffId(null); },
  });

  const removeStaffMut = useMutation({
    mutationFn: (staffId: number) => postJSON(token, '/activity-staff/remove', { activity_id: activityId, staff_id: staffId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }),
  });

  const addSectionMut = useMutation({
    mutationFn: () => postJSON(token, '/activity-sections', { activity_id: activityId, section_id: Number(addSectionId), student_count: typeof addStudentCount === 'number' ? addStudentCount : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }); setAddSectionId(null); },
  });

  const removeSectionMut = useMutation({
    mutationFn: (sectionId: number) => postJSON(token, '/activity-sections/remove', { activity_id: activityId, section_id: sectionId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }),
  });

  const addExpMut = useMutation({
    mutationFn: () => postJSON(token, '/activity-expenses', { activity_id: activityId, head: expForm.head, amount: typeof expForm.amount === 'number' ? expForm.amount : 0, notes: expForm.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }); setExpForm({ head: '', amount: 0, notes: '' }); },
  });

  const removeExpMut = useMutation({
    mutationFn: (id: number) => postJSON(token, `/activity-expenses/${id}/delete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }),
  });

  const updateStatusMut = useMutation({
    mutationFn: (s: string) => postJSON(token, `/activities/${activityId}/update`, { status: s }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); qc.invalidateQueries({ queryKey: ['activity-detail', activityId] }); },
  });

  const staffOptions = (staffData?.staff ?? []).map((s) => ({ value: String(s.id), label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() }));
  const sectionOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (const cls of classesData?.classes ?? []) {
      for (const sec of cls.sections ?? []) {
        out.push({ value: String(sec.id), label: `${cls.name} — ${sec.name}` });
      }
    }
    return out;
  }, [classesData]);

  if (isLoading) return <Skeleton height={300} radius="md" />;
  if (!data) return null;

  const { activity: a, staff, sections, expenses, total_expense } = data;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <Badge color={statusColor(a.status)}>{a.status}</Badge>
          <Text size="xs" c="dimmed">{a.activity_type?.replace('_', ' ')}</Text>
        </Group>
        <Group gap="xs">
          <Select
            placeholder="Update status…"
            data={STATUSES.map((s) => ({ value: s, label: s }))}
            value={statusUpdate}
            onChange={(v) => { setStatusUpdate(v); if (v) updateStatusMut.mutate(v); }}
            w={160}
            size="xs"
          />
          <Button size="xs" variant="light" leftSection={<FileText size={11} />} onClick={() => printFieldGuide(data, schoolName)}>
            Field Guide
          </Button>
        </Group>
      </Group>

      {a.description && <Text size="sm" c="dimmed">{a.description}</Text>}

      <Tabs defaultValue="staff">
        <Tabs.List>
          <Tabs.Tab value="staff">Staff ({staff.length})</Tabs.Tab>
          <Tabs.Tab value="sections">Sections ({sections.length})</Tabs.Tab>
          <Tabs.Tab value="expenses">Expenses (₹{total_expense.toLocaleString()})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="staff" pt="sm">
          <Stack gap="xs">
            <Group gap="xs">
              <Select placeholder="Add staff…" data={staffOptions} value={addStaffId} onChange={setAddStaffId} searchable clearable style={{ flex: 1 }} size="xs" />
              <Select data={[{ value: 'in_charge', label: 'In-charge' }, { value: 'helper', label: 'Helper' }]} value={addStaffRole} onChange={(v) => setAddStaffRole(v ?? 'in_charge')} w={110} size="xs" />
              <Button size="xs" onClick={() => addStaffMut.mutate()} loading={addStaffMut.isPending} disabled={!addStaffId}>Add</Button>
            </Group>
            {staff.map((s) => (
              <Group key={s.staff_id} justify="space-between">
                <Text size="sm">{s.name}</Text>
                <Group gap="xs">
                  <Badge size="xs" variant="outline">{s.role}</Badge>
                  <Button size="xs" variant="subtle" color="red" onClick={() => removeStaffMut.mutate(s.staff_id)}><Trash2 size={10} /></Button>
                </Group>
              </Group>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="sections" pt="sm">
          <Stack gap="xs">
            <Group gap="xs">
              <Select placeholder="Add section…" data={sectionOptions} value={addSectionId} onChange={setAddSectionId} searchable clearable style={{ flex: 1 }} size="xs" />
              <NumberInput placeholder="Students" value={addStudentCount} onChange={setAddStudentCount} min={0} w={100} size="xs" />
              <Button size="xs" onClick={() => addSectionMut.mutate()} loading={addSectionMut.isPending} disabled={!addSectionId}>Add</Button>
            </Group>
            {sections.map((s) => (
              <Group key={s.section_id} justify="space-between">
                <Text size="sm">{s.class_name} · {s.section_name}</Text>
                <Group gap="xs">
                  {s.student_count != null && <Badge size="xs" variant="outline">{s.student_count} students</Badge>}
                  <Button size="xs" variant="subtle" color="red" onClick={() => removeSectionMut.mutate(s.section_id)}><Trash2 size={10} /></Button>
                </Group>
              </Group>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="expenses" pt="sm">
          <Stack gap="xs">
            <Group gap="xs">
              <TextInput placeholder="Head (e.g. Transport)" value={expForm.head} onChange={(e) => setExpForm((f) => ({ ...f, head: e.currentTarget.value }))} style={{ flex: 1 }} size="xs" />
              <NumberInput placeholder="Amount" value={expForm.amount} onChange={(v) => setExpForm((f) => ({ ...f, amount: v }))} min={0} w={110} size="xs" />
              <Button size="xs" onClick={() => addExpMut.mutate()} loading={addExpMut.isPending} disabled={!expForm.head.trim()}>Add</Button>
            </Group>
            <Table withTableBorder striped>
              <Table.Thead><Table.Tr><Table.Th>Head</Table.Th><Table.Th ta="right">Amount</Table.Th><Table.Th /></Table.Tr></Table.Thead>
              <Table.Tbody>
                {expenses.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td><Text size="sm">{e.head}</Text>{e.notes && <Text size="xs" c="dimmed">{e.notes}</Text>}</Table.Td>
                    <Table.Td ta="right"><Text size="sm">₹{e.amount.toLocaleString()}</Text></Table.Td>
                    <Table.Td ta="right"><Button size="xs" variant="subtle" color="red" onClick={() => removeExpMut.mutate(e.id)}><Trash2 size={10} /></Button></Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td><Text size="sm" fw={700}>Total</Text></Table.Td>
                  <Table.Td ta="right"><Text size="sm" fw={700}>₹{total_expense.toLocaleString()}</Text></Table.Td>
                  <Table.Td />
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function ActivityScreen() {
  const token = useAuth((s) => s.token)!;
  const { data: schoolData } = useSchool();
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', activity_type: 'field_visit', date: '', end_date: '', venue: '', description: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['activities', filter],
    queryFn: () => apiActivities(token, filter ?? undefined),
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/activities', form),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['activities'] }); setOpen(false); if (res.id) setSelected(res.id); },
  });

  const activities = data?.activities ?? [];

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group gap="sm" mb={4}>
          <Bus size={20} color="var(--mantine-color-brand-6)" />
          <Title order={2}>Activities</Title>
        </Group>

        <Group gap="lg" align="flex-start" wrap="nowrap">
          {/* Left — activity list */}
          <Stack gap="xs" style={{ width: 240, flexShrink: 0 }}>
            <Group justify="space-between" align="center">
              <Select
                data={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
                value={filter ?? ''}
                onChange={(v) => setFilter(v || null)}
                size="xs"
                style={{ flex: 1 }}
              />
              <Button size="xs" leftSection={<Plus size={11} />} onClick={() => setOpen(true)}>New</Button>
            </Group>
            {isLoading ? <Skeleton height={180} radius="md" /> : activities.length === 0 ? (
              <Text size="xs" c="dimmed">No activities.</Text>
            ) : (
              activities.map((a) => (
                <Card
                  key={a.id}
                  p="xs"
                  style={{ cursor: 'pointer', border: selected === a.id ? '1.5px solid var(--mantine-color-brand-5)' : '1px solid var(--mantine-color-gray-2)' }}
                  onClick={() => setSelected(a.id)}
                >
                  <Text size="sm" fw={selected === a.id ? 700 : 400} lineClamp={1}>{a.title}</Text>
                  <Group gap={4} mt={2}>
                    <Badge size="xs" color={statusColor(a.status)}>{a.status}</Badge>
                    {a.date && <Text size="xs" c="dimmed">{a.date}</Text>}
                  </Group>
                </Card>
              ))
            )}
          </Stack>

          {/* Right — detail */}
          <Card style={{ flex: 1 }}>
            {selected ? (
              <ActivityDetailPanel token={token} activityId={selected} schoolName={schoolData?.name ?? 'School'} />
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">Select an activity to manage it.</Text>
            )}
          </Card>
        </Group>
      </Stack>

      <Modal opened={open} onClose={() => setOpen(false)} title="New Activity" size="md">
        <Stack gap="sm">
          <TextInput label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.currentTarget.value }))} />
          <Select label="Type" data={ACTIVITY_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} value={form.activity_type} onChange={(v) => setForm((f) => ({ ...f, activity_type: v ?? 'field_visit' }))} />
          <Group grow>
            <TextInput type="date" label="Start Date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.currentTarget.value }))} />
            <TextInput type="date" label="End Date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.currentTarget.value }))} />
          </Group>
          <TextInput label="Venue" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.currentTarget.value }))} />
          <Textarea label="Description" autosize minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))} />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!form.title.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
