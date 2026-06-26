import { useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// Each category maps either to a meeting (with a meeting_type) or an activity.
const CATEGORIES = [
  { value: 'department', label: 'Department Meeting', kind: 'meeting' as const, type: 'department' },
  { value: 'staff', label: 'Staff Meeting', kind: 'meeting' as const, type: 'staff' },
  { value: 'parent', label: 'Parent Meeting', kind: 'meeting' as const, type: 'parent' },
  { value: 'government', label: 'Government / Board Meeting', kind: 'meeting' as const, type: 'government' },
  { value: 'event', label: 'Event / Activity', kind: 'activity' as const, type: 'event' },
];

const blank = { category: 'department', title: '', date: '', start_time: '', venue: '', notes: '' };

async function postJSON(token: string, path: string, body: object) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json();
}

/**
 * Floating event-creation button (bottom-right). Creates any type of event —
 * department / staff / parent / government meetings, or an event/activity —
 * from a single quick form, then refreshes the dashboard agenda.
 */
export function EventFab() {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const cat = CATEGORIES.find((c) => c.value === form.category) ?? CATEGORIES[0];

  const createMut = useMutation({
    mutationFn: () => {
      if (cat.kind === 'meeting') {
        return postJSON(token, '/meetings', {
          title: form.title,
          meeting_type: cat.type,
          date: form.date,
          start_time: form.start_time || undefined,
          venue: form.venue || undefined,
          agenda: form.notes || undefined,
        });
      }
      return postJSON(token, '/activities', {
        title: form.title,
        activity_type: cat.type,
        date: form.date || undefined,
        venue: form.venue || undefined,
        description: form.notes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-agenda'] });
      qc.invalidateQueries({ queryKey: ['dashboard-meetings-today'] });
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      setOpen(false);
      setForm(blank);
    },
  });

  return (
    <>
      <Tooltip label="Create event" position="left" withArrow>
        <ActionIcon
          onClick={() => setOpen(true)}
          radius="xl"
          size={56}
          color="brand"
          variant="filled"
          aria-label="Create event"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 44,
            zIndex: 200,
            boxShadow: '0 6px 20px rgba(62, 123, 123, 0.45)',
          }}
        >
          <CalendarPlus size={26} strokeWidth={2} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={open} onClose={() => setOpen(false)} title="Create Event" size="md" radius="md">
        <Stack gap="sm">
          <Select
            label="Type"
            data={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v ?? 'department' }))}
            allowDeselect={false}
          />
          <TextInput
            label="Title"
            placeholder={cat.kind === 'meeting' ? 'e.g. Monthly staff sync' : 'e.g. Annual Sports Day'}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.currentTarget.value }))}
          />
          <Group grow>
            <TextInput
              type="date"
              label="Date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.currentTarget.value }))}
            />
            {cat.kind === 'meeting' && (
              <TextInput
                type="time"
                label="Start time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.currentTarget.value }))}
              />
            )}
          </Group>
          <TextInput
            label="Venue"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.currentTarget.value }))}
          />
          <Textarea
            label={cat.kind === 'meeting' ? 'Agenda' : 'Description'}
            autosize
            minRows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.currentTarget.value }))}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              loading={createMut.isPending}
              disabled={!form.title.trim() || (cat.kind === 'meeting' && !form.date)}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
