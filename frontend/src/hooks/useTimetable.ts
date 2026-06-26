import { useQuery } from '@tanstack/react-query';
import { fetchTimetable } from '../api/client';
import { useAuth } from '../stores/auth';

export function useTimetable(sectionId: number | null) {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ['timetable', sectionId],
    queryFn: () => fetchTimetable(token as string, sectionId as number),
    enabled: !!token && sectionId != null,
  });
}
