import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchStaff } from '../api/client';
import { useAuth } from '../stores/auth';

export function useStaff(q: string) {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['staff', q],
    queryFn: () => fetchStaff(token as string, { q }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
}
