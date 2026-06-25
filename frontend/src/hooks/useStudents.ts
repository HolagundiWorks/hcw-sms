import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchStudents } from '../api/client';
import { useAuth } from '../stores/auth';

export function useStudents(q: string) {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['students', q],
    queryFn: () => fetchStudents(token as string, { q }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
}
