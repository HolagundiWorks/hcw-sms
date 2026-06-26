import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
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
import { AlertCircle, Plus, Printer, Wallet } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { useClasses } from '../hooks/useClasses';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useAuth } from '../stores/auth';
import type { AcademicYear } from '../api/client';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeHead {
  id: number;
  name: string;
  description: string | null;
  is_optional: number;
}

interface FeeStructure {
  id: number;
  academic_year_id: number | null;
  class_id: number | null;
  class_name: string | null;
  fee_head_id: number;
  fee_head_name: string;
  amount: number;
  due_date: string | null;
}

interface FeePayment {
  id: number;
  student_id: number;
  first_name: string | null;
  last_name: string | null;
  fee_head_id: number;
  fee_head_name: string;
  amount_paid: number;
  payment_date: string | null;
  payment_mode: string | null;
  reference: string | null;
  receipt_no: string | null;
}

interface OutstandingRow {
  student_id: number;
  first_name: string | null;
  last_name: string | null;
  fee_head_id: number;
  fee_head_name: string;
  amount_due: number;
  due_date: string | null;
  amount_paid: number;
  balance: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

async function apiFeeHeads(token: string): Promise<{ fee_heads: FeeHead[] }> {
  return fetch(`${BASE}/fee-heads`, { headers: authed(token) }).then((r) => r.json());
}

async function apiFeeStructures(token: string, yearId?: number, classId?: number): Promise<{ structures: FeeStructure[] }> {
  const qs = new URLSearchParams();
  if (yearId) qs.set('year_id', String(yearId));
  if (classId) qs.set('class_id', String(classId));
  return fetch(`${BASE}/fee-structures?${qs}`, { headers: authed(token) }).then((r) => r.json());
}

async function apiFeePayments(token: string, studentId?: number, yearId?: number): Promise<{ payments: FeePayment[] }> {
  const qs = new URLSearchParams();
  if (studentId) qs.set('student_id', String(studentId));
  if (yearId) qs.set('year_id', String(yearId));
  return fetch(`${BASE}/fee-payments?${qs}`, { headers: authed(token) }).then((r) => r.json());
}

async function apiFeeOutstanding(token: string, yearId?: number): Promise<{ outstanding: OutstandingRow[] }> {
  const qs = yearId ? `?year_id=${yearId}` : '';
  return fetch(`${BASE}/fee-payments/outstanding${qs}`, { headers: authed(token) }).then((r) => r.json());
}

async function apiFeeOverdue(token: string, yearId?: number): Promise<{ overdue: OutstandingRow[] }> {
  const qs = yearId ? `?year_id=${yearId}` : '';
  return fetch(`${BASE}/fee-payments/overdue${qs}`, { headers: authed(token) }).then((r) => r.json());
}

async function postJSON(token: string, path: string, body: object) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...authed(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

const PAYMENT_MODES = ['cash', 'cheque', 'upi', 'neft', 'card', 'dd'];

// ─── Fee Heads panel ──────────────────────────────────────────────────────────
function FeeHeadsPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['fee-heads'], queryFn: () => apiFeeHeads(token), staleTime: 120_000 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_optional: false });

  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/fee-heads', { name: form.name, description: form.description || undefined, is_optional: form.is_optional }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-heads'] }); setOpen(false); setForm({ name: '', description: '', is_optional: false }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => postJSON(token, `/fee-heads/${id}/delete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-heads'] }),
  });

  const heads = data?.fee_heads ?? [];

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={600}>Fee Heads</Text>
        <Button size="xs" leftSection={<Plus size={12} />} onClick={() => setOpen(true)}>Add</Button>
      </Group>
      {heads.length === 0 ? (
        <Text size="sm" c="dimmed">No fee heads defined. Add heads like Tuition, Transport, Library…</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead>
            <Table.Tr><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th /></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {heads.map((h) => (
              <Table.Tr key={h.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>{h.name}</Text>
                  {h.description && <Text size="xs" c="dimmed">{h.description}</Text>}
                </Table.Td>
                <Table.Td><Badge size="xs" variant="outline" color={h.is_optional ? 'gray' : 'brand'}>{h.is_optional ? 'Optional' : 'Mandatory'}</Badge></Table.Td>
                <Table.Td ta="right">
                  <Button size="xs" variant="subtle" color="red" onClick={() => deleteMut.mutate(h.id)} loading={deleteMut.isPending}>Remove</Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={open} onClose={() => setOpen(false)} title="Add Fee Head" size="sm">
        <Stack gap="sm">
          <TextInput label="Name" placeholder="e.g. Tuition Fee" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} />
          <TextInput label="Description" placeholder="Optional" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))} />
          <Checkbox label="Optional fee" checked={form.is_optional} onChange={(e) => setForm((f) => ({ ...f, is_optional: e.currentTarget.checked }))} />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} loading={createMut.isPending} disabled={!form.name.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ─── Fee Structure panel ──────────────────────────────────────────────────────
function FeeStructurePanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: headsData } = useQuery({ queryKey: ['fee-heads'], queryFn: () => apiFeeHeads(token), staleTime: 120_000 });
  const { data: classesData } = useClasses();
  const { data: yearsData } = useAcademicYears();
  const [filterYear, setFilterYear] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fee_head_id: '', amount: 0 as number | string, academic_year_id: '', class_id: '', due_date: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['fee-structures', filterYear, filterClass],
    queryFn: () => apiFeeStructures(token, filterYear ? Number(filterYear) : undefined, filterClass ? Number(filterClass) : undefined),
    staleTime: 60_000,
  });

  const saveMut = useMutation({
    mutationFn: () => postJSON(token, '/fee-structures', {
      fee_head_id: Number(form.fee_head_id),
      amount: typeof form.amount === 'number' ? form.amount : 0,
      academic_year_id: form.academic_year_id ? Number(form.academic_year_id) : undefined,
      class_id: form.class_id ? Number(form.class_id) : undefined,
      due_date: form.due_date || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-structures'] }); setOpen(false); },
  });

  const headOptions = (headsData?.fee_heads ?? []).map((h) => ({ value: String(h.id), label: h.name }));
  const yearOptions = (yearsData?.years ?? []).map((y: AcademicYear) => ({ value: String(y.id), label: y.label }));
  const classOptions = [{ value: '', label: 'All classes' }, ...(classesData?.classes ?? []).map((c) => ({ value: String(c.id), label: c.name ?? `Class ${c.id}` }))];

  const structures = data?.structures ?? [];

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <Group gap="sm">
          <Select label="Year" data={yearOptions} value={filterYear} onChange={setFilterYear} clearable placeholder="All years" w={160} />
          <Select label="Class" data={classOptions} value={filterClass} onChange={setFilterClass} clearable placeholder="All classes" w={180} />
        </Group>
        <Button size="sm" leftSection={<Plus size={12} />} onClick={() => setOpen(true)}>Set Amount</Button>
      </Group>

      {isLoading ? <Skeleton height={120} radius="md" /> : structures.length === 0 ? (
        <Text size="sm" c="dimmed">No fee structures defined for this selection.</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead>
            <Table.Tr><Table.Th>Fee Head</Table.Th><Table.Th>Class</Table.Th><Table.Th ta="right">Amount</Table.Th><Table.Th>Due Date</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {structures.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td><Text size="sm" fw={500}>{s.fee_head_name}</Text></Table.Td>
                <Table.Td><Text size="sm">{s.class_name ?? 'All'}</Text></Table.Td>
                <Table.Td ta="right"><Text size="sm">₹{s.amount.toLocaleString()}</Text></Table.Td>
                <Table.Td><Text size="sm">{s.due_date ?? '—'}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={open} onClose={() => setOpen(false)} title="Set Fee Amount" size="sm">
        <Stack gap="sm">
          <Select label="Fee Head" placeholder="Select…" data={headOptions} value={form.fee_head_id} onChange={(v) => setForm((f) => ({ ...f, fee_head_id: v ?? '' }))} />
          <NumberInput label="Amount (₹)" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} min={0} />
          <Group grow>
            <Select label="Academic Year" placeholder="All years" data={yearOptions} value={form.academic_year_id} onChange={(v) => setForm((f) => ({ ...f, academic_year_id: v ?? '' }))} clearable />
            <Select label="Class" placeholder="All classes" data={classOptions} value={form.class_id} onChange={(v) => setForm((f) => ({ ...f, class_id: v ?? '' }))} clearable />
          </Group>
          <TextInput type="date" label="Due Date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.currentTarget.value }))} />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending} disabled={!form.fee_head_id}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ─── Collect payment panel ────────────────────────────────────────────────────
function CollectPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: headsData } = useQuery({ queryKey: ['fee-heads'], queryFn: () => apiFeeHeads(token), staleTime: 120_000 });
  const { data: studentsData } = useStudents('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fee_head_id: '', amount_paid: 0 as number | string,
    payment_date: '', payment_mode: 'cash', reference: '', notes: '',
  });
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['fee-payments', studentId],
    queryFn: () => apiFeePayments(token, studentId ? Number(studentId) : undefined),
    enabled: !!studentId,
    staleTime: 30_000,
  });

  const collectMut = useMutation({
    mutationFn: () => postJSON(token, '/fee-payments', {
      student_id: Number(studentId),
      fee_head_id: Number(form.fee_head_id),
      amount_paid: typeof form.amount_paid === 'number' ? form.amount_paid : 0,
      payment_date: form.payment_date || undefined,
      payment_mode: form.payment_mode,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['fee-payments'] });
      qc.invalidateQueries({ queryKey: ['fee-outstanding'] });
      setLastReceipt(res.receipt_no ?? null);
      setForm((f) => ({ ...f, fee_head_id: '', amount_paid: 0, reference: '', notes: '' }));
    },
  });

  const printReceipt = (rcpt: string) => {
    const html = `<!DOCTYPE html><html><head><title>Fee Receipt</title>
<style>body{font-family:'Segoe UI',sans-serif;max-width:480px;margin:40px auto;}
.label{color:#888;font-size:0.8rem;}@media print{body{margin:10mm;}}
hr{border:none;border-top:1px solid #ddd;margin:12px 0;}</style></head>
<body><h2>Fee Receipt</h2><hr/>
<p class="label">Receipt No</p><p><strong>${rcpt}</strong></p>
<p class="label">Generated by LEOS</p>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const studentOptions = (studentsData?.students ?? []).map((s) => ({
    value: String(s.id),
    label: `${s.first_name ?? ''} ${s.last_name ?? ''} #${s.id}`.trim(),
  }));
  const headOptions = (headsData?.fee_heads ?? []).map((h) => ({ value: String(h.id), label: h.name }));
  const payments = paymentsData?.payments ?? [];

  return (
    <Stack gap="md">
      <Select label="Select Student" placeholder="Search…" data={studentOptions} value={studentId} onChange={setStudentId} searchable w={320} />

      {studentId && (
        <>
          <Card p="sm" withBorder>
            <Text size="sm" fw={600} mb="xs">Collect Payment</Text>
            <Stack gap="xs">
              <Group grow>
                <Select label="Fee Head" placeholder="Select…" data={headOptions} value={form.fee_head_id} onChange={(v) => setForm((f) => ({ ...f, fee_head_id: v ?? '' }))} />
                <NumberInput label="Amount (₹)" value={form.amount_paid} onChange={(v) => setForm((f) => ({ ...f, amount_paid: v }))} min={0} />
              </Group>
              <Group grow>
                <TextInput type="date" label="Payment Date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.currentTarget.value }))} />
                <Select label="Mode" data={PAYMENT_MODES.map((m) => ({ value: m, label: m.toUpperCase() }))} value={form.payment_mode} onChange={(v) => setForm((f) => ({ ...f, payment_mode: v ?? 'cash' }))} />
              </Group>
              <TextInput label="Reference / Cheque No" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.currentTarget.value }))} />
              <Group justify="flex-end">
                <Button onClick={() => collectMut.mutate()} loading={collectMut.isPending} disabled={!form.fee_head_id}>Collect & Generate Receipt</Button>
              </Group>
              {lastReceipt && (
                <Group gap="sm">
                  <Badge color="mint">Receipt: {lastReceipt}</Badge>
                  <Button size="xs" variant="subtle" leftSection={<Printer size={11} />} onClick={() => printReceipt(lastReceipt)}>Print</Button>
                </Group>
              )}
            </Stack>
          </Card>

          <Text size="sm" fw={600}>Payment History</Text>
          {isLoading ? <Skeleton height={80} radius="md" /> : payments.length === 0 ? (
            <Text size="sm" c="dimmed">No payments recorded for this student.</Text>
          ) : (
            <Table withTableBorder striped>
              <Table.Thead>
                <Table.Tr><Table.Th>Fee Head</Table.Th><Table.Th ta="right">Amount</Table.Th><Table.Th>Date</Table.Th><Table.Th>Mode</Table.Th><Table.Th>Receipt</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payments.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td><Text size="sm">{p.fee_head_name}</Text></Table.Td>
                    <Table.Td ta="right"><Text size="sm">₹{p.amount_paid.toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.payment_date ?? '—'}</Text></Table.Td>
                    <Table.Td><Badge size="xs" variant="outline">{p.payment_mode?.toUpperCase()}</Badge></Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{p.receipt_no}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </>
      )}
    </Stack>
  );
}

// ─── Outstanding / Overdue panel ──────────────────────────────────────────────
function OutstandingPanel({ token }: { token: string }) {
  const { data: yearsData } = useAcademicYears();
  const [yearId, setYearId] = useState<string | null>(null);
  const [view, setView] = useState<'outstanding' | 'overdue'>('overdue');

  const yearOptions = (yearsData?.years ?? []).map((y: AcademicYear) => ({ value: String(y.id), label: y.label }));

  const { data: outData, isLoading: loadOut } = useQuery({
    queryKey: ['fee-outstanding', yearId],
    queryFn: () => apiFeeOutstanding(token, yearId ? Number(yearId) : undefined),
    staleTime: 60_000,
  });

  const { data: overdueData, isLoading: loadOver } = useQuery({
    queryKey: ['fee-overdue', yearId],
    queryFn: () => apiFeeOverdue(token, yearId ? Number(yearId) : undefined),
    staleTime: 60_000,
  });

  const rows = view === 'overdue' ? (overdueData?.overdue ?? []) : (outData?.outstanding ?? []);
  const isLoading = view === 'overdue' ? loadOver : loadOut;

  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <Group gap="sm">
          <Select label="Year" data={yearOptions} value={yearId} onChange={setYearId} clearable placeholder="All years" w={160} />
          <Select
            label="View"
            data={[{ value: 'overdue', label: 'Overdue (past due date)' }, { value: 'outstanding', label: 'All outstanding' }]}
            value={view}
            onChange={(v) => setView((v as typeof view) ?? 'overdue')}
            w={220}
          />
        </Group>
        {rows.length > 0 && (
          <Group gap="xs">
            <AlertCircle size={14} color="var(--mantine-color-red-6)" />
            <Text size="sm" fw={600} c="red">{rows.length} entries · ₹{totalBalance.toLocaleString()} outstanding</Text>
          </Group>
        )}
      </Group>

      {isLoading ? <Skeleton height={140} radius="md" /> : rows.length === 0 ? (
        <Text size="sm" c="dimmed">No {view === 'overdue' ? 'overdue' : 'outstanding'} fees found.</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Fee Head</Table.Th>
              <Table.Th ta="right">Due</Table.Th>
              <Table.Th ta="right">Paid</Table.Th>
              <Table.Th ta="right">Balance</Table.Th>
              <Table.Th>Due Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r, i) => (
              <Table.Tr key={i}>
                <Table.Td><Text size="sm">{[r.first_name, r.last_name].filter(Boolean).join(' ')}</Text></Table.Td>
                <Table.Td><Text size="sm">{r.fee_head_name}</Text></Table.Td>
                <Table.Td ta="right"><Text size="sm">₹{r.amount_due.toLocaleString()}</Text></Table.Td>
                <Table.Td ta="right"><Text size="sm">₹{r.amount_paid.toLocaleString()}</Text></Table.Td>
                <Table.Td ta="right"><Text size="sm" fw={600} c="red">₹{r.balance.toLocaleString()}</Text></Table.Td>
                <Table.Td><Text size="sm" c={r.due_date && r.due_date < new Date().toISOString().slice(0, 10) ? 'red' : undefined}>{r.due_date ?? '—'}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function FeeScreen() {
  const token = useAuth((s) => s.token)!;
  const [tab, setTab] = useState('collect');

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group gap="sm" mb={4}>
          <Wallet size={20} color="var(--mantine-color-brand-6)" />
          <Title order={2}>Fees</Title>
        </Group>

        <Card>
          <Tabs value={tab} onChange={(v) => setTab(v ?? 'collect')}>
            <Tabs.List mb="md">
              <Tabs.Tab value="collect">Collect Payment</Tabs.Tab>
              <Tabs.Tab value="outstanding">Outstanding / Overdue</Tabs.Tab>
              <Tabs.Tab value="structure">Fee Structure</Tabs.Tab>
              <Tabs.Tab value="heads">Fee Heads</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="collect"><CollectPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="outstanding"><OutstandingPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="structure"><FeeStructurePanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="heads"><FeeHeadsPanel token={token} /></Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </Container>
  );
}
