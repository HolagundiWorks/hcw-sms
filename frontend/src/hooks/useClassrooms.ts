import { useQuery } from '@tanstack/react-query';
import { fetchClassrooms } from '../api/client';
import { useAuth } from '../stores/auth';

export function useClassrooms() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: () => fetchClassrooms(token as string),
    enabled: !!token,
  });
}
