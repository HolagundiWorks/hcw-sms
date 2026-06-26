import { useQuery } from '@tanstack/react-query';
import { fetchPeriods } from '../api/client';
import { useAuth } from '../stores/auth';

export function useTimings() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['periods'],
    queryFn: () => fetchPeriods(token as string),
    enabled: !!token,
  });
}
