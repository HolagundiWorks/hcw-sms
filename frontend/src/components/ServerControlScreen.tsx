import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Container,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  Activity,
  CircleAlert,
  Play,
  RotateCw,
  Server,
  Square,
  Wrench,
} from 'lucide-react';
import {
  isTauri,
  serverLogs,
  serverRepair,
  serverRestart,
  serverSetAutostart,
  serverStart,
  serverStatus,
  serverStop,
  type ServerState,
  type ServerStatus,
} from '../api/serverControl';
import type { AccentColor } from '../theme';

const STATE_COLOR: Record<ServerState, AccentColor | 'gray'> = {
  running: 'mint',
  starting: 'sky',
  repairing: 'yellow',
  crashed: 'peach',
  stopped: 'gray',
};

const STATE_LABEL: Record<ServerState, string> = {
  running: 'Running',
  starting: 'Starting…',
  repairing: 'Repairing…',
  crashed: 'Crashed',
  stopped: 'Stopped',
};

function uptime(secs: number): string {
  if (secs <= 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h ? `${h}h` : '', m || h ? `${m}m` : '', `${s}s`].filter(Boolean).join(' ');
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
    </div>
  );
}

export function ServerControlScreen() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logViewport = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!isTauri) return;
    try {
      const [s, l] = await Promise.all([serverStatus(), serverLogs(200)]);
      setStatus(s);
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (!isTauri) return;
    void refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  // Keep the log view pinned to the newest line.
  useEffect(() => {
    logViewport.current?.scrollTo({ top: logViewport.current.scrollHeight });
  }, [logs]);

  const run = async (name: string, action: () => Promise<ServerStatus>) => {
    setBusy(name);
    setError(null);
    try {
      setStatus(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      void refresh();
    }
  };

  if (!isTauri) {
    return (
      <Container size="md" px={0}>
        <Title order={2} mb="sm">Server Control</Title>
        <Alert color="sky" icon={<CircleAlert size={16} />} data-testid="server-control-browser-notice">
          The server control panel runs inside the LEOS desktop app, where it can
          start, stop, and repair the local backend service. It isn’t available in
          a plain browser session.
        </Alert>
      </Container>
    );
  }

  const state = status?.state ?? 'stopped';
  const managed = status?.managed ?? false;
  const canControl = managed && !busy;

  return (
    <Container size="lg" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>Server Control</Title>
            <Text c="dimmed">Local LEOS backend service</Text>
          </div>
          <Badge
            size="lg"
            variant="light"
            color={STATE_COLOR[state]}
            leftSection={<Activity size={13} />}
            data-testid="server-state-badge"
          >
            {STATE_LABEL[state]}
          </Badge>
        </Group>

        {error && (
          <Alert color="peach" icon={<CircleAlert size={16} />} withCloseButton onClose={() => setError(null)} data-testid="server-control-error">
            {error}
          </Alert>
        )}

        {status && !managed && (
          <Alert color="yellow" icon={<CircleAlert size={16} />}>
            The backend is running <b>embedded</b> in the app, so it can’t be
            stopped or restarted independently. Health and logs are still shown
            below. (Install the standalone server binary to enable full control.)
          </Alert>
        )}

        <Card withBorder>
          <Group justify="space-between" wrap="nowrap" mb="md">
            <Group gap="sm">
              <ThemeIcon size={40} radius="md" variant="light" color={STATE_COLOR[state]}>
                <Server size={20} />
              </ThemeIcon>
              <div>
                <Text fw={700}>leos-server</Text>
                <Text size="xs" c="dimmed">
                  {status?.healthy ? 'Health check passing' : 'Health check failing'} · {status?.backend ?? '—'}
                </Text>
              </div>
            </Group>
            <Switch
              label="Auto-restart on crash"
              checked={status?.autostart ?? false}
              disabled={!canControl}
              onChange={(e) => run('autostart', () => serverSetAutostart(e.currentTarget.checked))}
              data-testid="server-autostart-switch"
            />
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
            <Stat label="Port" value={status ? String(status.port) : '—'} />
            <Stat label="PID" value={status?.pid ? String(status.pid) : '—'} />
            <Stat label="Uptime" value={uptime(status?.uptime_secs ?? 0)} />
            <Stat label="Health" value={status?.healthy ? 'OK' : 'Down'} />
          </SimpleGrid>

          <Group gap="sm">
            <Button
              leftSection={<Play size={15} />}
              color="mint"
              disabled={!canControl || state === 'running'}
              loading={busy === 'start'}
              onClick={() => run('start', serverStart)}
              data-testid="server-start-button"
            >
              Start
            </Button>
            <Button
              leftSection={<Square size={15} />}
              variant="light"
              color="peach"
              disabled={!canControl || state === 'stopped'}
              loading={busy === 'stop'}
              onClick={() => run('stop', serverStop)}
              data-testid="server-stop-button"
            >
              Stop
            </Button>
            <Button
              leftSection={<RotateCw size={15} />}
              variant="light"
              disabled={!canControl}
              loading={busy === 'restart'}
              onClick={() => run('restart', serverRestart)}
              data-testid="server-restart-button"
            >
              Restart
            </Button>
            <Button
              leftSection={<Wrench size={15} />}
              variant="light"
              color="yellow"
              disabled={!canControl}
              loading={busy === 'repair'}
              onClick={() => run('repair', serverRepair)}
              data-testid="server-repair-button"
            >
              Repair
            </Button>
          </Group>

          {status?.last_error && (
            <Text size="xs" c="peach.7" mt="sm" data-testid="server-last-error">
              Last error: {status.last_error}
            </Text>
          )}
        </Card>

        <Card withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Server logs</Text>
            <Text size="xs" c="dimmed">{logs.length} lines · live</Text>
          </Group>
          <ScrollArea h={260} viewportRef={logViewport} data-testid="server-logs">
            <Code block style={{ fontSize: 12, background: 'transparent' }}>
              {logs.length ? logs.join('\n') : 'No log output yet.'}
            </Code>
          </ScrollArea>
        </Card>
      </Stack>
    </Container>
  );
}
