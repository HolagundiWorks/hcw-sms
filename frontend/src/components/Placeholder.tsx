import { Card, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Wrench } from 'lucide-react';

/** Stand-in for nav items that don't have a screen yet. */
export function Placeholder({ screenKey }: { screenKey: string }) {
  const label = screenKey.charAt(0).toUpperCase() + screenKey.slice(1);
  return (
    <Container size="xl" px={0}>
      <Card>
        <Stack align="center" gap="sm" py={48}>
          <ThemeIcon size={56} radius="lg" variant="light" color="brand">
            <Wrench size={28} strokeWidth={1.5} />
          </ThemeIcon>
          <Title order={3}>{label}</Title>
          <Text c="dimmed">This screen is coming soon.</Text>
        </Stack>
      </Card>
    </Container>
  );
}
