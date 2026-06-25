import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '../api/client';
import { useAuth } from '../stores/auth';

export function useDashboardSummary() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => fetchDashboardSummary(token as string),
    enabled: !!token,
  });
}
