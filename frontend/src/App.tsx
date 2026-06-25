import { useState } from 'react';
import type { SessionUser } from './types';
import { useAuth } from './stores/auth';
import { LoginPage } from './components/LoginPage';
import { AppShellLayout } from './components/AppShellLayout';
import { DashboardScreen } from './components/DashboardPage';
import { StudentsScreen } from './components/StudentsScreen';
import { StaffScreen } from './components/StaffScreen';
import { Placeholder } from './components/Placeholder';

// Auth gate + simple nav. The shell lives here so screens are just content;
// a router can replace the switch as the app grows.
export function App() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const [active, setActive] = useState('dashboard');

  if (!token || !user) {
    return <LoginPage />;
  }

  const sessionUser: SessionUser = {
    name: user.name || user.username,
    role: user.profile,
  };

  return (
    <AppShellLayout user={sessionUser} activeKey={active} onNavigate={setActive}>
      {active === 'dashboard' ? (
        <DashboardScreen user={sessionUser} />
      ) : active === 'students' ? (
        <StudentsScreen />
      ) : active === 'staff' ? (
        <StaffScreen />
      ) : (
        <Placeholder screenKey={active} />
      )}
    </AppShellLayout>
  );
}
