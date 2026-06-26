import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchSubjects } from '../api/client';
import { useAuth } from '../stores/auth';

export function useSubjects(q: string) {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['subjects', q],
    queryFn: () => fetchSubjects(token as string, { q }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
}
