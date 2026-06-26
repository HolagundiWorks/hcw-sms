import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../api/client';
import { useAuth } from '../stores/auth';

export function useCourses() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => fetchCourses(token as string),
    enabled: !!token,
  });
}
