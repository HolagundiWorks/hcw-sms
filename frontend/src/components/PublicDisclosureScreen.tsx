import {
  Alert, Badge, Button, Card, Container, Divider, Group, Stack, Table, Text, Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Globe, Info, Printer } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { fetchComplianceCerts, fetchSchool, fetchStatutoryReport } from '../api/client';
import { printHtml, publicDisclosureHtml, type DisclosureData } from '../lib/printDoc';

export function PublicDisclosureScreen() {
  const token = useAuth((s) => s.token)!;
  const { data: school } = useQuery({ queryKey: ['school'], queryFn: () => fetchSchool(token) });
  const { data: report } = useQuery({ queryKey: ['statutory-report'], queryFn: () => fetchStatutoryReport(token) });
  const { data: certs } = useQuery({ queryKey: ['compliance-certs'], queryFn: () => fetchComplianceCerts(token) });

  const general: [string, string][] = [
    ['Name of the school', school?.name ?? '—'],
    ['Affiliation No.', school?.affiliation_no ?? '—'],
    ['School Code', school?.school_code ?? '—'],
    ['UDISE Code', school?.udise_code ?? '—'],
    ['Complete address', school?.address ?? '—'],
    ['Principal', school?.principal_name ?? '—'],
    ['Academic session', school?.academic_year ?? '—'],
  ];

  const documents = (certs?.certificates ?? [])
    .filter((c) => c.scope === 'school')
    .map((c) => ({
      cert_type: c.cert_type ?? '—',
      authority: c.authority ?? '',
      reference_no: c.reference_no ?? '',
      validity: c.expiry_date ?? 'No expiry',
      status: c.status,
    }));

  const staffStudents: [string, string | number][] = report
    ? [
        ['Total students', report.students.total],
        ['Boys / Girls', `${report.students.by_gender.Male} / ${report.students.by_gender.Female}`],
        ['EWS / RTE students', report.students.rte_ews],
        ['CWSN students', report.students.cwsn],
        ['Total staff', report.staff.total],
        ['Teaching staff', report.staff.teaching],
        ['Classrooms', report.infrastructure.classrooms],
        ['Sections', report.infrastructure.sections],
      ]
    : [];

  const build = (): DisclosureData => ({
    school: {
      name: school?.name, academic_year: school?.academic_year, address: school?.address,
      principal_name: school?.principal_name, affiliation_no: school?.affiliation_no,
      school_code: school?.school_code, udise_code: school?.udise_code,
    },
    logo: school?.logo,
    general,
    documents,
    staffStudents,
  });

  const idsMissing = !school?.affiliation_no || !school?.udise_code;

  return (
    <Container size="lg" px={0}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Group gap="sm"><Globe size={20} color="var(--mantine-color-brand-6)" /><Title order={2}>Mandatory Public Disclosure</Title></Group>
          <Button leftSection={<Printer size={16} />} onClick={() => printHtml(publicDisclosureHtml(build()))} data-testid="disclosure-print">Print / Save PDF</Button>
        </Group>

        <Alert color="sky" variant="light" icon={<Info size={16} />}>
          CBSE requires every affiliated school to publish this disclosure on its website. LEOS assembles it from your live data — review, then print/save as PDF to upload.
          {idsMissing && <Text size="sm" mt={4} c="orange">Set the Affiliation / UDISE codes under <b>Compliance → OASIS / UDISE</b> for a complete disclosure.</Text>}
        </Alert>

        <Card withBorder padding="lg">
          <Text fw={700} c="brand" mb="xs">A — General Information</Text>
          <Table withTableBorder>
            <Table.Tbody>{general.map(([k, v]) => <Table.Tr key={k}><Table.Td w="40%"><Text size="sm" fw={500}>{k}</Text></Table.Td><Table.Td><Text size="sm">{v}</Text></Table.Td></Table.Tr>)}</Table.Tbody>
          </Table>

          <Divider my="md" />
          <Text fw={700} c="brand" mb="xs">B — Documents &amp; Statutory Certificates</Text>
          {documents.length > 0 ? (
            <Table withTableBorder striped>
              <Table.Thead><Table.Tr><Table.Th>Certificate</Table.Th><Table.Th>Authority</Table.Th><Table.Th>Valid upto</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>{documents.map((c, i) => (
                <Table.Tr key={i}><Table.Td><Text size="sm">{c.cert_type}</Text></Table.Td><Table.Td><Text size="xs">{c.authority || '—'}</Text></Table.Td><Table.Td><Text size="xs">{c.validity}</Text></Table.Td>
                  <Table.Td><Badge size="xs" variant="light" color={c.status === 'Expired' ? 'red' : c.status === 'Expiring' ? 'yellow' : 'mint'}>{c.status}</Badge></Table.Td></Table.Tr>
              ))}</Table.Tbody>
            </Table>
          ) : <Text size="sm" c="dimmed">No school certificates recorded yet — add them under Compliance → Certificates &amp; Safety.</Text>}

          <Divider my="md" />
          <Text fw={700} c="brand" mb="xs">C — Staff &amp; Students</Text>
          <Table withTableBorder>
            <Table.Tbody>{staffStudents.map(([k, v]) => <Table.Tr key={k}><Table.Td w="40%"><Text size="sm" fw={500}>{k}</Text></Table.Td><Table.Td><Text size="sm">{v}</Text></Table.Td></Table.Tr>)}</Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  );
}
