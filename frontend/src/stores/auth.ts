import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as apiLogin, type ApiUser } from '../api/client';

interface AuthState {
  token: string | null;
  user: ApiUser | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

// Persisted to localStorage so a reload keeps the session. The query layer
// signs out automatically on a 401 (expired token) — see lib/queryClient.ts.
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      signIn: async (username, password) => {
        const { token, user } = await apiLogin(username, password);
        set({ token, user });
      },
      signOut: () => set({ token: null, user: null }),
    }),
    { name: 'hcwsms-auth' },
  ),
);
