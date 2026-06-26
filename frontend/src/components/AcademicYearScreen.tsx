import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange, ChevronDown, ChevronUp, Lock, Plus, Trash2 } from 'lucide-react';
import type { AcademicYear, Term } from '../api/client';
import {
  activateAcademicYear,
  activateTerm,
  closeAcademicYear,
  createAcademicYear,
  createTerm,
  deleteTerm,
} from '../api/client';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useAuth } from '../stores/auth';

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

// ─── Term row ──────────────────────────────────────────────────────────────
function TermRow({ term, yearClosed, onActivate, onDelete }: {
  term: Term;
  yearClosed: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const range = formatDateRange(term.start_date, term.end_date);
  return (
    <Group justify="space-between" wrap="nowrap" py={4}>
      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
        <Badge
          size="xs"
          variant={term.is_active ? 'filled' : 'light'}
          color={term.is_active ? 'teal' : 'gray'}
          style={{ flexShrink: 0 }}
        >
          {term.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <Text size="sm" fw={term.is_active ? 600 : 400} truncate>
          {term.label}
        </Text>
        {range && (
          <Text size="xs" c="dimmed" truncate>
            {range}
          </Text>
        )}
      </Group>
      <Group gap={4} style={{ flexShrink: 0 }}>
        {!term.is_active && !yearClosed && (
          <Button size="xs" variant="subtle" color="teal" onClick={onActivate}>
            Set Active
          </Button>
        )}
        <ActionIcon size="sm" variant="subtle" color="red" onClick={onDelete} title="Delete term">
          <Trash2 size={13} />
        </ActionIcon>
      </Group>
    </Group>
  );
}

// ─── Add term inline form ───────────────────────────────────────────────────
function AddTermForm({ yearId, onDone }: { yearId: number; onDone: () => void }) {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const create = useMutation({
    mutationFn: () => createTerm(token, { year_id: yearId, label, start_date: start || undefined, end_date: end || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] });
      qc.invalidateQueries({ queryKey: ['active-year'] });
      setLabel(''); setStart(''); setEnd('');
      onDone();
    },
  });

  return (
    <Stack gap="xs" pt="xs">
      <Divider />
      <Group gap="xs" wrap="nowrap" align="flex-end">
        <TextInput
          placeholder="Term label e.g. Term 1"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          size="xs"
          style={{ flex: 2, minWidth: 0 }}
        />
        <TextInput
          type="date"
          placeholder="Start date"
          value={start}
          onChange={(e) => setStart(e.currentTarget.value)}
          size="xs"
          style={{ flex: 1.5, minWidth: 0 }}
        />
        <TextInput
          type="date"
          placeholder="End date"
          value={end}
          onChange={(e) => setEnd(e.currentTarget.value)}
          size="xs"
          style={{ flex: 1.5, minWidth: 0 }}
        />
        <Button
          size="xs"
          onClick={() => create.mutate()}
          loading={create.isPending}
          disabled={!label.trim()}
          style={{ flexShrink: 0 }}
        >
          Add
        </Button>
        <Button size="xs" variant="subtle" color="gray" onClick={onDone} style={{ flexShrink: 0 }}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
}

// ─── Year card ─────────────────────────────────────────────────────────────
function YearCard({ year }: { year: AcademicYear }) {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [open, setOpen] = useState(year.is_active);
  const [addingTerm, setAddingTerm] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['academic-years'] });
    qc.invalidateQueries({ queryKey: ['active-year'] });
  };

  const activate = useMutation({
    mutationFn: () => activateAcademicYear(token, year.id),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: () => closeAcademicYear(token, year.id),
    onSuccess: () => { setConfirmClose(false); invalidate(); },
  });

  const doDeleteTerm = useMutation({
    mutationFn: (id: number) => deleteTerm(token, id),
    onSuccess: invalidate,
  });

  const doActivateTerm = useMutation({
    mutationFn: (id: number) => activateTerm(token, id),
    onSuccess: invalidate,
  });

  const borderColor = year.is_active ? 'var(--mantine-color-teal-5)' : year.is_closed ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-gray-3)';
  const range = formatDateRange(year.start_date, year.end_date);

  return (
    <>
      <Card
        withBorder
        style={{
          borderColor,
          borderWidth: year.is_active ? 2 : 1,
          opacity: year.is_closed ? 0.65 : 1,
        }}
      >
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <CalendarRange size={18} strokeWidth={1.8} color={year.is_active ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-5)'} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Text fw={700} size="sm">{year.label}</Text>
                {year.is_active && <Badge size="xs" color="teal">Active</Badge>}
                {year.is_closed && <Badge size="xs" color="gray" leftSection={<Lock size={10} />}>Closed</Badge>}
                {!year.is_active && !year.is_closed && <Badge size="xs" color="gray" variant="outline">Inactive</Badge>}
              </Group>
              {range && <Text size="xs" c="dimmed">{range}</Text>}
            </div>
          </Group>

          <Group gap={4} style={{ flexShrink: 0 }}>
            {!year.is_active && !year.is_closed && (
              <Button size="xs" variant="light" color="teal" onClick={() => activate.mutate()} loading={activate.isPending}>
                Activate
              </Button>
            )}
            {year.is_active && !year.is_closed && (
              <Button size="xs" variant="subtle" color="red" onClick={() => setConfirmClose(true)}>
                Close Year
              </Button>
            )}
            <ActionIcon size="sm" variant="subtle" onClick={() => setOpen((o) => !o)} title="Toggle terms">
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </ActionIcon>
          </Group>
        </Group>

        {/* Terms */}
        <Collapse in={open}>
          <Stack gap={2} mt="sm">
            <Group justify="space-between">
              <Text size="xs" fw={600} c="dimmed">
                TERMS ({year.terms.length})
              </Text>
              {!year.is_closed && (
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<Plus size={12} />}
                  onClick={() => setAddingTerm(true)}
                  disabled={addingTerm}
                >
                  Add Term
                </Button>
              )}
            </Group>

            {year.terms.length === 0 && !addingTerm && (
              <Text size="xs" c="dimmed" py="xs">
                No terms defined. Add terms to track marking periods.
              </Text>
            )}

            {year.terms.map((t) => (
              <TermRow
                key={t.id}
                term={t}
                yearClosed={year.is_closed}
                onActivate={() => doActivateTerm.mutate(t.id)}
                onDelete={() => doDeleteTerm.mutate(t.id)}
              />
            ))}

            {addingTerm && (
              <AddTermForm yearId={year.id} onDone={() => setAddingTerm(false)} />
            )}
          </Stack>
        </Collapse>
      </Card>

      {/* Close year confirmation */}
      <Modal
        opened={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Close Academic Year"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Alert color="orange" icon={<AlertTriangle size={14} />}>
            Closing {year.label} is permanent. The year will be archived and cannot be re-activated. All data is preserved.
          </Alert>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setConfirmClose(false)}>Cancel</Button>
            <Button color="red" onClick={() => close.mutate()} loading={close.isPending}>
              Close {year.label}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// ─── Create year modal ──────────────────────────────────────────────────────
function CreateYearModal({ onClose }: { onClose: () => void }) {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const create = useMutation({
    mutationFn: () => createAcademicYear(token, { label, start_date: start || undefined, end_date: end || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] });
      onClose();
    },
  });

  const nextLabel = () => {
    const y = new Date().getFullYear();
    return `${y}-${String(y + 1).slice(2)}`;
  };

  return (
    <Modal opened onClose={onClose} title="New Academic Year" centered size="sm">
      <Stack gap="md">
        <TextInput
          label="Label"
          placeholder={nextLabel()}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          required
        />
        <Group grow>
          <TextInput
            type="date"
            label="Start date"
            value={start}
            onChange={(e) => setStart(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            label="End date"
            value={end}
            onChange={(e) => setEnd(e.currentTarget.value)}
          />
        </Group>
        <Text size="xs" c="dimmed">
          After creating, use "Activate" to make it the current year. You can add terms once it's created.
        </Text>
        <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!label.trim()}>
          Create Academic Year
        </Button>
      </Stack>
    </Modal>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export function AcademicYearScreen() {
  const { data, isLoading } = useAcademicYears();
  const [creating, setCreating] = useState(false);

  const activeYear = data?.years.find((y) => y.is_active);

  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>Academic Year</Title>
            <Text c="dimmed">
              {activeYear
                ? `Current year: ${activeYear.label}${activeYear.terms.find((t) => t.is_active) ? ` · ${activeYear.terms.find((t) => t.is_active)!.label}` : ''}`
                : 'No active academic year — activate one below.'}
            </Text>
          </div>
          <Button leftSection={<Plus size={15} />} onClick={() => setCreating(true)}>
            New Year
          </Button>
        </Group>

        {isLoading && (
          <Text c="dimmed" ta="center" py="xl">Loading…</Text>
        )}

        {!isLoading && data?.years.length === 0 && (
          <Card withBorder>
            <Stack align="center" py="xl" gap="xs">
              <CalendarRange size={36} strokeWidth={1.5} color="var(--mantine-color-gray-4)" />
              <Text fw={500}>No academic years configured</Text>
              <Text size="sm" c="dimmed">Create your first academic year to get started.</Text>
              <Button mt="xs" leftSection={<Plus size={14} />} onClick={() => setCreating(true)}>
                Create Academic Year
              </Button>
            </Stack>
          </Card>
        )}

        {data?.years.map((year) => (
          <YearCard key={year.id} year={year} />
        ))}
      </Stack>

      {creating && <CreateYearModal onClose={() => setCreating(false)} />}
    </Container>
  );
}
