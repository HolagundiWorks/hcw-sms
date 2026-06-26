import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  JsonInput,
  PasswordInput,
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
import { AlertCircle, CheckCircle, Image as ImageIcon, Link, Palette, Unlink } from 'lucide-react';
import { useAuth } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DesignConnection {
  id: number;
  provider: string;
  account_email: string | null;
  token_expiry: string | null;
  scopes: string | null;
  last_sync: string | null;
  connected_at: string | null;
}

interface DesignTemplate {
  id: number;
  template_id: string;
  template_name: string | null;
  thumbnail_url: string | null;
  category: string | null;
  field_map: string | null;
}

interface DesignJob {
  id: number;
  job_type: string | null;
  entity_type: string | null;
  entity_ids: string | null;
  status: string | null;
  output_path: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  created_at: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

async function apiGet<T>(token: string, path: string): Promise<T> {
  return fetch(`${BASE}${path}`, { headers: authed(token) }).then((r) => r.json());
}

async function postJSON(token: string, path: string, body: object) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...authed(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

const CATEGORIES = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'poster', label: 'Event Poster' },
  { value: 'report_cover', label: 'Report Cover' },
  { value: 'other', label: 'Other' },
];

const STUDENT_FIELDS = [
  'first_name', 'last_name', 'class_name', 'section_name',
  'enrollment_no', 'birthdate', 'photo_url', 'guardian_name',
];

// ─── Connection panel ─────────────────────────────────────────────────────────
function ConnectionPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [email, setEmail] = useState('');
  const [expiry, setExpiry] = useState('');
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['design-connection'],
    queryFn: () => apiGet<{ connection: DesignConnection | null }>(token, '/design/connection'),
    staleTime: 60_000,
  });

  const connectMut = useMutation({
    mutationFn: () => postJSON(token, '/design/connection', {
      access_token: accessToken,
      refresh_token: refreshToken,
      account_email: email,
      token_expiry: expiry,
      scopes: 'design:content:read design:content:write',
    }),
    onSuccess: (d) => { setResult(d.error ? { error: d.error } : { ok: true }); qc.invalidateQueries({ queryKey: ['design-connection'] }); setAccessToken(''); setRefreshToken(''); },
    onError: (e) => setResult({ error: String(e) }),
  });

  const disconnectMut = useMutation({
    mutationFn: () => postJSON(token, '/design/connection/disconnect', {}),
    onSuccess: () => { setResult(null); qc.invalidateQueries({ queryKey: ['design-connection'] }); },
  });

  const connection = data?.connection;

  return (
    <Stack gap="sm">
      <Group gap="xs">
        <Link size={16} color="var(--mantine-color-brand-6)" />
        <Text size="sm" fw={500}>Canva account connection</Text>
      </Group>

      {isLoading ? <Skeleton height={100} radius="md" /> : connection ? (
        <Card withBorder p="sm">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text size="sm" fw={500}>{connection.account_email ?? 'Canva account'}</Text>
              <Text size="xs" c="dimmed">Connected · Expires: {connection.token_expiry ?? 'not set'}</Text>
              <Text size="xs" c="dimmed">Scopes: {connection.scopes ?? '—'}</Text>
            </Stack>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<Unlink size={12} />}
              onClick={() => disconnectMut.mutate()}
              loading={disconnectMut.isPending}
            >Disconnect</Button>
          </Group>
        </Card>
      ) : (
        <>
          <Text size="sm" c="dimmed">
            Connect your Canva account to enable batch ID card and certificate generation.
            Obtain an access token from the Canva Developer Portal (never store it elsewhere — LEOS
            encrypts it locally and it never leaves this device).
          </Text>
          <Stack gap="xs">
            <PasswordInput
              label="Canva Access Token"
              placeholder="Paste your Canva API access token…"
              value={accessToken}
              onChange={(e) => setAccessToken(e.currentTarget.value)}
            />
            <PasswordInput
              label="Refresh Token (optional)"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.currentTarget.value)}
            />
            <TextInput
              label="Account email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <TextInput
              label="Token expiry (ISO date)"
              placeholder="2026-12-31T00:00:00Z"
              value={expiry}
              onChange={(e) => setExpiry(e.currentTarget.value)}
            />
            <Group>
              <Button
                leftSection={<Link size={14} />}
                onClick={() => connectMut.mutate()}
                loading={connectMut.isPending}
                disabled={!accessToken.trim()}
              >Connect Canva</Button>
            </Group>
          </Stack>
        </>
      )}

      {result && (
        result.error ? (
          <Alert icon={<AlertCircle size={14} />} color="red">{result.error}</Alert>
        ) : (
          <Alert icon={<CheckCircle size={14} />} color="green">Canva account connected. Token encrypted locally.</Alert>
        )
      )}
    </Stack>
  );
}

// ─── Templates panel ──────────────────────────────────────────────────────────
function TemplatesPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<string>('id_card');
  const [editMap, setEditMap] = useState<number | null>(null);
  const [mapJson, setMapJson] = useState('{}');
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['design-templates'],
    queryFn: () => apiGet<{ templates: DesignTemplate[] }>(token, '/design/templates'),
    staleTime: 60_000,
  });

  const saveMut = useMutation({
    mutationFn: () => postJSON(token, '/design/templates', { template_id: templateId, template_name: templateName, category }),
    onSuccess: (d) => { setResult(d.error ? { error: d.error } : { ok: true }); qc.invalidateQueries({ queryKey: ['design-templates'] }); setTemplateId(''); setTemplateName(''); },
    onError: (e) => setResult({ error: String(e) }),
  });

  const mapMut = useMutation({
    mutationFn: () => {
      try { JSON.parse(mapJson); } catch { return Promise.reject(new Error('Invalid JSON')); }
      return postJSON(token, `/design/templates/${editMap}/field-map`, JSON.parse(mapJson));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-templates'] }); setEditMap(null); },
  });

  const templates = data?.templates ?? [];

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Register Canva template IDs here, then map Canva template fields to LEOS student/staff data fields.
        Get template IDs from the URL when viewing a template in Canva (e.g. <code>DAFk3jxyz</code>).
      </Text>
      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label="Canva Template ID"
          placeholder="DAFk3jxyz"
          value={templateId}
          onChange={(e) => setTemplateId(e.currentTarget.value)}
          w={200}
          styles={{ input: { fontFamily: 'monospace' } }}
        />
        <TextInput
          label="Display name"
          placeholder="Student ID Card 2025"
          value={templateName}
          onChange={(e) => setTemplateName(e.currentTarget.value)}
          w={220}
        />
        <Select label="Category" data={CATEGORIES} value={category} onChange={(v) => setCategory(v ?? 'id_card')} w={150} />
        <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending} disabled={!templateId.trim()}>Add Template</Button>
      </Group>

      {result && (
        result.error ? (
          <Alert icon={<AlertCircle size={14} />} color="red">{result.error}</Alert>
        ) : (
          <Alert icon={<CheckCircle size={14} />} color="green">Template saved.</Alert>
        )
      )}

      {isLoading ? <Skeleton height={150} radius="md" /> : templates.length === 0 ? (
        <Text size="sm" c="dimmed">No templates yet.</Text>
      ) : (
        templates.map((t) => (
          <Card key={t.id} p="sm" withBorder>
            <Group justify="space-between" mb={editMap === t.id ? 'xs' : 0}>
              <Group gap="sm">
                {t.thumbnail_url && <Image src={t.thumbnail_url} w={48} h={32} fit="contain" />}
                <Stack gap={2}>
                  <Text size="sm" fw={500}>{t.template_name ?? t.template_id}</Text>
                  <Group gap="xs">
                    <Badge size="xs" variant="outline">{t.category}</Badge>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>{t.template_id}</Text>
                  </Group>
                </Stack>
              </Group>
              <Button size="xs" variant="subtle" onClick={() => { setEditMap(t.id); setMapJson(t.field_map ?? '{}'); }}>
                Map Fields
              </Button>
            </Group>
            {editMap === t.id && (
              <Stack gap="xs" mt="xs">
                <Text size="xs" c="dimmed">
                  Map Canva field names to LEOS fields. Available LEOS fields: {STUDENT_FIELDS.join(', ')}.
                </Text>
                <JsonInput
                  label='Field map (Canva field name → LEOS field name)'
                  placeholder={`{"StudentName": "first_name", "ClassSection": "class_name"}`}
                  value={mapJson}
                  onChange={setMapJson}
                  autosize
                  minRows={4}
                  formatOnBlur
                />
                <Group justify="flex-end" gap="xs">
                  <Button variant="subtle" color="gray" size="xs" onClick={() => setEditMap(null)}>Cancel</Button>
                  <Button size="xs" onClick={() => mapMut.mutate()} loading={mapMut.isPending}>Save Map</Button>
                </Group>
              </Stack>
            )}
          </Card>
        ))
      )}
    </Stack>
  );
}

// ─── Batch generation + approval panel ───────────────────────────────────────
function BatchPanel({ token }: { token: string }) {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState<string>('students');
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const { data: templatesData } = useQuery({
    queryKey: ['design-templates'],
    queryFn: () => apiGet<{ templates: DesignTemplate[] }>(token, '/design/templates'),
    staleTime: 60_000,
  });

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['design-jobs'],
    queryFn: () => apiGet<{ jobs: DesignJob[] }>(token, '/design/jobs'),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: () => postJSON(token, '/design/jobs', {
      job_type: 'batch',
      entity_type: entityType,
      entity_ids: entityIds.map(Number),
      template_id: selectedTemplate ? Number(selectedTemplate) : null,
    }),
    onSuccess: (d) => { setResult(d.error ? { error: d.error } : { ok: true }); qc.invalidateQueries({ queryKey: ['design-jobs'] }); },
    onError: (e) => setResult({ error: String(e) }),
  });

  const approveMut = useMutation({
    mutationFn: (jobId: number) => postJSON(token, `/design/jobs/${jobId}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['design-jobs'] }),
  });

  const templates = templatesData?.templates ?? [];
  const jobs = jobsData?.jobs ?? [];

  const statusColor = (s: string | null) =>
    s === 'approved' ? 'green' : s === 'pending' ? 'orange' : s === 'generating' ? 'blue' : 'gray';

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Create a batch design job (ID cards, certificates). Jobs require principal approval before generation proceeds.
        Enter entity IDs as a comma-separated list.
      </Text>
      <Group align="flex-end" gap="sm" wrap="wrap">
        <Select
          label="Entity type"
          data={[{ value: 'students', label: 'Students' }, { value: 'staff', label: 'Staff' }]}
          value={entityType}
          onChange={(v) => setEntityType(v ?? 'students')}
          w={140}
        />
        <Select
          label="Template"
          placeholder="Pick template"
          data={templates.map((t) => ({ value: String(t.id), label: t.template_name ?? t.template_id }))}
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          clearable
          w={220}
        />
        <TextInput
          label="Entity IDs (comma-separated)"
          placeholder="1,2,3,4"
          w={200}
          onChange={(e) => setEntityIds(e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
        <Button
          leftSection={<ImageIcon size={14} />}
          onClick={() => { setResult(null); createMut.mutate(); }}
          loading={createMut.isPending}
          disabled={entityIds.length === 0}
        >Queue Batch Job</Button>
      </Group>
      {result && (
        result.error ? (
          <Alert icon={<AlertCircle size={14} />} color="red">{result.error}</Alert>
        ) : (
          <Alert icon={<CheckCircle size={14} />} color="green">Job created — awaiting approval.</Alert>
        )
      )}

      {isLoading ? <Skeleton height={150} radius="md" /> : jobs.length === 0 ? (
        <Text size="sm" c="dimmed">No batch jobs yet.</Text>
      ) : (
        <Table withTableBorder striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Created</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Entities</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Approved by</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {jobs.map((j) => {
              const ids: number[] = (() => { try { return JSON.parse(j.entity_ids ?? '[]'); } catch { return []; } })();
              return (
                <Table.Tr key={j.id}>
                  <Table.Td><Text size="xs" c="dimmed">{j.created_at.slice(0, 16)}</Text></Table.Td>
                  <Table.Td><Badge size="xs" variant="outline">{j.entity_type}</Badge></Table.Td>
                  <Table.Td><Text size="xs">{ids.length} item{ids.length !== 1 ? 's' : ''}</Text></Table.Td>
                  <Table.Td><Badge size="xs" color={statusColor(j.status)}>{j.status ?? 'pending'}</Badge></Table.Td>
                  <Table.Td><Text size="xs">{j.approved_by_name ?? '—'}</Text></Table.Td>
                  <Table.Td>
                    {j.status === 'pending' && (
                      <Button size="xs" variant="subtle" color="green" onClick={() => approveMut.mutate(j.id)} loading={approveMut.isPending}>
                        Approve
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function DesignScreen() {
  const token = useAuth((s) => s.token)!;
  const [tab, setTab] = useState('connection');

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group gap="sm" mb={4}>
          <Palette size={20} color="var(--mantine-color-brand-6)" />
          <Title order={2}>LEOS Design Connect</Title>
          <Badge variant="light" color="brand">Add-on</Badge>
        </Group>

        <Card>
          <Tabs value={tab} onChange={(v) => setTab(v ?? 'connection')}>
            <Tabs.List mb="md">
              <Tabs.Tab value="connection">Canva Connection</Tabs.Tab>
              <Tabs.Tab value="templates">Templates &amp; Field Map</Tabs.Tab>
              <Tabs.Tab value="batch">Batch Generation</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="connection"><ConnectionPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="templates"><TemplatesPanel token={token} /></Tabs.Panel>
            <Tabs.Panel value="batch"><BatchPanel token={token} /></Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </Container>
  );
}
