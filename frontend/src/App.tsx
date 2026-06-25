import { useState } from 'react';
import type { SessionUser } from './types';
import { useAuth } from './stores/auth';
import { LoginPage } from './components/LoginPage';
import { CockpitShell } from './components/cockpit/CockpitShell';
import { DashboardScreen } from './components/DashboardPage';
import { StudentsScreen } from './components/StudentsScreen';
import { StaffScreen } from './components/StaffScreen';
import { Placeholder } from './components/Placeholder';

// Auth gate + cockpit shell. Active module drives the workspace + ribbon.
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
    <CockpitShell user={sessionUser} active={active} onNavigate={setActive}>
      {active === 'dashboard' ? (
        <DashboardScreen user={sessionUser} />
      ) : active === 'students' ? (
        <StudentsScreen />
      ) : active === 'staff' ? (
        <StaffScreen />
      ) : (
        <Placeholder screenKey={active} />
      )}
    </CockpitShell>
  );
}
