import { Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { modules } from '../../modules';

interface IconRailProps {
  active: string;
  onSelect: (key: string) => void;
}

/** 48px latent icon rail — quiet navigation, labels on hover. */
export function IconRail({ active, onSelect }: IconRailProps) {
  return (
    <Stack gap={4} align="center" py="xs">
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = m.key === active;
        return (
          <Tooltip key={m.key} label={m.label} position="right" openDelay={200} withArrow>
            <UnstyledButton
              onClick={() => onSelect(m.key)}
              aria-label={m.label}
              data-active={isActive || undefined}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive
                  ? 'var(--mantine-color-brand-7)'
                  : 'var(--mantine-color-gray-6)',
                background: isActive ? 'var(--mantine-color-brand-1)' : 'transparent',
              }}
            >
              <Icon size={20} strokeWidth={1.9} />
            </UnstyledButton>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
