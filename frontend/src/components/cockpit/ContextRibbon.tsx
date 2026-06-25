import { Button, Group, Kbd, Text, Tooltip } from '@mantine/core';
import { moduleByKey } from '../../modules';

/** Bottom action surface — contextual actions for the active module (max 6). */
export function ContextRibbon({ active }: { active: string }) {
  const mod = moduleByKey[active];
  const actions = (mod?.actions ?? []).slice(0, 6);

  if (actions.length === 0) {
    return (
      <Group h="100%" px="md">
        <Text size="sm" c="dimmed">
          No quick actions for {mod?.label ?? 'this screen'}.
        </Text>
      </Group>
    );
  }

  return (
    <Group h="100%" px="md" gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
      {actions.map((a, i) => {
        const Icon = a.icon;
        const btn = (
          <Button
            variant={i === 0 ? 'filled' : 'default'}
            leftSection={<Icon size={16} strokeWidth={1.9} />}
            size="sm"
            style={{ flexShrink: 0 }}
          >
            {a.label}
          </Button>
        );
        return a.shortcut ? (
          <Tooltip key={a.key} label={<Kbd>{a.shortcut}</Kbd>} withArrow openDelay={300}>
            {btn}
          </Tooltip>
        ) : (
          <span key={a.key}>{btn}</span>
        );
      })}
    </Group>
  );
}
