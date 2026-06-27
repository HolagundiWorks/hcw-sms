// Thin HTTP client for API tests — mirrors how the frontend talks to the
// server (JSON over HTTP, Bearer token from /auth/login).
import { ADMIN_PASS, ADMIN_USER } from './env';

export interface ApiResult<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
}

export class ApiClient {
  constructor(
    private baseUrl: string,
    public token: string | null = null,
  ) {}

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResult<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      /* empty / non-JSON body */
    }
    return { status: res.status, ok: res.ok, body: parsed as T };
  }

  get<T = unknown>(path: string) {
    return this.request<T>('GET', path);
  }
  post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  /** Authenticate as the seeded admin and store the bearer token. */
  async login(username = ADMIN_USER, password = ADMIN_PASS) {
    const res = await this.post<{ token: string }>('/auth/login', { username, password });
    if (res.ok && res.body?.token) this.token = res.body.token;
    return res;
  }
}

export function api(baseUrl: string) {
  return new ApiClient(baseUrl);
}

/** Convenience: return a client already logged in as admin. */
export async function authedApi(baseUrl: string) {
  const client = new ApiClient(baseUrl);
  const res = await client.login();
  if (!res.ok) throw new Error(`Test admin login failed: HTTP ${res.status}`);
  return client;
}
