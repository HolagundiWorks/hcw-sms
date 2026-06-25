import type { SessionUser } from './types';
import { useAuth } from './stores/auth';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';

// Auth gate: no session -> login screen; otherwise the app shell + dashboard.
// (A router can be added here as more screens land.)
export function App() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  if (!token || !user) {
    return <LoginPage />;
  }

  const sessionUser: SessionUser = {
    name: user.name || user.username,
    role: user.profile,
  };
  return <DashboardPage user={sessionUser} />;
}
