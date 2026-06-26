import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Checkbox,
  Container,
  Group,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CreditCard, PackageCheck, Shirt } from 'lucide-react';
import { ApiError } from '../api/client';
import { useClasses } from '../hooks/useClasses';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// Item markers tracked per student (no quantities / no accounting).
const ITEMS = [
  { key: 'id', label: 'ID Card', Icon: CreditCard },
  { key: 'books', label: 'Books', Icon: BookOpen },
  { key: 'uniform', label: 'Uniform', Icon: Shirt },
] as const;

interface IssuedRow {
  student_id: number;
  first_name: string | null;
  last_name: string | null;
  items: Record<string, boolean>;
  dates: Record<string, string | null>;
}

async function fetchIssued(token: string, sectionId: number): Promise<{ students: IssuedRow[] }> {
  const r = await fetch(`${BASE}/issued?section_id=${sectionId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json();
}
async function markIssued(token: string, body: { student_id: number; item_type: string; issued: boolean }) {
  const r = await fetch(`${BASE}/issued/mark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new ApiError(`HTTP ${r.status}`, r.status);
  return r.json();
}

interface FlatSection { id: number; label: string; }

export function IssuedItemsScreen() {
  const token = useAuth((s) => s.token)!;
  const qc = useQueryClient();
  const [sectionId, setSectionId] = useState<string | null>(null);
  const { data: classesData } = useClasses();

  const flatSections = useMemo<FlatSection[]>(() => {
    const out: FlatSection[] = [];
    for (const cls of classesData?.classes ?? []) {
      for (const sec of cls.sections ?? []) out.push({ id: sec.id, label: `${cls.name} — ${sec.name}` });
    }
    return out;
  }, [classesData]);
  const sectionOptions = flatSections.map((s) => ({ value: String(s.id), label: s.label }));

  const { data, isLoading } = useQuery({
    queryKey: ['issued', sectionId],
    queryFn: () => fetchIssued(token, Number(sectionId)),
    enabled: !!sectionId,
    staleTime: 30_000,
  });

  const markMut = useMutation({
    mutationFn: (b: { student_id: number; item_type: string; issued: boolean }) => markIssued(token, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issued', sectionId] }),
  });

  const students = data?.students ?? [];
  const issuedCount = (key: string) => students.filter((s) => s.items?.[key]).length;

  return (
    <Container size="lg" px={0}>
      <Stack gap="lg">
        <div>
          <Group gap="sm">
            <PackageCheck size={20} color="var(--mantine-color-brand-6)" />
            <Title order={2}>Issued Items</Title>
          </Group>
          <Text c="dimmed" size="sm">Mark which items each student has received — ID card, books, uniform</Text>
        </div>

        <Card>
          <Select
            label="Class / Section"
            placeholder="Select class + section…"
            data={sectionOptions}
            value={sectionId}
            onChange={setSectionId}
            searchable
            w={300}
          />
        </Card>

        {!sectionId ? (
          <Card><Text size="sm" c="dimmed" ta="center" py="md">Select a class to mark issued items.</Text></Card>
        ) : isLoading ? (
          <Skeleton height={220} radius="md" />
        ) : students.length === 0 ? (
          <Card><Text size="sm" c="dimmed" ta="center" py="md">No students enrolled in this section yet.</Text></Card>
        ) : (
          <Card>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  {ITEMS.map((it) => (
                    <Table.Th key={it.key} style={{ textAlign: 'center', width: 110 }}>
                      <Group gap={4} justify="center" wrap="nowrap">
                        <it.Icon size={14} />
                        <span>{it.label}</span>
                      </Group>
                      <Badge size="xs" variant="light" color={issuedCount(it.key) === students.length ? 'mint' : 'gray'} mt={2}>
                        {issuedCount(it.key)}/{students.length}
                      </Badge>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {students.map((s) => (
                  <Table.Tr key={s.student_id}>
                    <Table.Td><Text size="sm">{[s.first_name, s.last_name].filter(Boolean).join(' ')}</Text></Table.Td>
                    {ITEMS.map((it) => {
                      const checked = !!s.items?.[it.key];
                      const date = s.dates?.[it.key];
                      return (
                        <Table.Td key={it.key} style={{ textAlign: 'center' }}>
                          <Tooltip label={checked && date ? `Issued ${date}` : 'Not issued'} withArrow disabled={!checked}>
                            <Checkbox
                              checked={checked}
                              color="mint"
                              onChange={(e) => markMut.mutate({ student_id: s.student_id, item_type: it.key, issued: e.currentTarget.checked })}
                              style={{ display: 'inline-flex' }}
                            />
                          </Tooltip>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
