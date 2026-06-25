import type { Role } from '../roles';

// Base URL of the PHP API wrapper. Overridable via VITE_API_BASE (and later the
// Tauri build). Defaults to the local Podman PHP stack.
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiUser {
  id: number;
  username: string;
  profile: Role;
  name: string;
}

export interface DashboardSummary {
  students: number;
  staff: number;
  schools: number;
  courses: number;
}

interface ReqOpts {
  method?: string;
  token?: string | null;
  body?: unknown;
}

async function req<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body */
  }
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export function login(username: string, password: string) {
  return req<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

export async function fetchMe(token: string) {
  const { user } = await req<{ user: ApiUser }>('/auth/me', { token });
  return user;
}

export async function fetchDashboardSummary(token: string) {
  const { summary } = await req<{ summary: DashboardSummary }>(
    '/dashboard/summary',
    { token },
  );
  return summary;
}
