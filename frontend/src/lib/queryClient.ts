import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { useAuth } from '../stores/auth';

// Global query client. Any query that 401s (expired/invalid token) signs the
// user out so the app falls back to the login screen.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        useAuth.getState().signOut();
      }
    },
  }),
});
