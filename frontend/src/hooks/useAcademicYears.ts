import { useQuery } from '@tanstack/react-query';
import { fetchAcademicYears, fetchActiveYear } from '../api/client';
import { useAuth } from '../stores/auth';

export function useAcademicYears() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: () => fetchAcademicYears(token as string),
    enabled: !!token,
  });
}

export function useActiveYear() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['active-year'],
    queryFn: () => fetchActiveYear(token as string),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}
