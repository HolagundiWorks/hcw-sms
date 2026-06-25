import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconSchool } from '@tabler/icons-react';
import { ApiError } from '../api/client';
import { useAuth } from '../stores/auth';

export function LoginPage() {
  const signIn = useAuth((s) => s.signIn);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" className="hcw-ui hcw-ui--fullscreen" p="md">
      <Card w={380} withBorder shadow="sm" radius="lg" p="xl">
        <Stack gap="lg">
          <Stack gap={6} align="center">
            <ThemeIcon size={52} radius="lg" variant="light" color="brand">
              <IconSchool size={30} stroke={1.6} />
            </ThemeIcon>
            <Title order={3} ta="center">
              HCW School Management System
            </Title>
            <Text size="sm" c="dimmed">
              Sign in to continue
            </Text>
          </Stack>

          <form onSubmit={submit}>
            <Stack gap="md">
              {error && (
                <Alert color="peach" radius="md" icon={<IconAlertCircle size={16} />}>
                  {error}
                </Alert>
              )}
              <TextInput
                label="Username"
                placeholder="your username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
                autoFocus
              />
              <PasswordInput
                label="Password"
                placeholder="your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <Button type="submit" fullWidth loading={loading} mt="xs">
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Center>
  );
}
