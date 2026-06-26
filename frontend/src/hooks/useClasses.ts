import { useQuery } from '@tanstack/react-query';
import { fetchClasses } from '../api/client';
import { useAuth } from '../stores/auth';

export function useClasses() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClasses(token as string),
    enabled: !!token,
  });
}
