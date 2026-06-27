import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

// Staff CRUD over the API. Staff has no per-id GET, so reads go through the
// list/search endpoint (mirrors how StaffScreen reads).
interface StaffRow {
  id: number;
  last_name: string | null;
  phone: string | null;
  profile: string | null;
}

describe('API · staff CRUD', () => {
  let client: ApiClient;
  const stamp = Date.now();
  const last = `StaffPersist-${stamp}`;
  let createdId: number;

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
  });

  const findByLast = async (l: string) => {
    const res = await client.get<{ staff: StaffRow[] }>(`/staff?q=${encodeURIComponent(l)}`);
    return { res, row: res.body.staff.find((s) => s.last_name === l) };
  };

  it('lists seeded staff', async () => {
    const res = await client.get<{ staff: StaffRow[]; total: number }>('/staff');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.staff)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('creates a staff member (POST /staff)', async () => {
    const res = await client.post<{ ok: boolean; id: number }>('/staff', {
      first_name: 'Tina',
      last_name: last,
      profile: 'teacher',
      email: `tina.${stamp}@example.test`,
    });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    createdId = res.body.id;
  });

  it('finds the new staff via search and stored the role', async () => {
    const { res, row } = await findByLast(last);
    expect(res.status).toBe(200);
    expect(row).toBeDefined();
    expect(row!.id).toBe(createdId);
    expect(row!.profile).toBe('teacher');
  });

  it('updates a staff member and persists the change', async () => {
    const upd = await client.post<{ ok: boolean }>(`/staff/${createdId}/update`, {
      first_name: 'Tina',
      last_name: last,
      profile: 'admin',
      phone: '+91 90000 77777',
    });
    expect(upd.status).toBe(200);

    const { row } = await findByLast(last);
    expect(row!.phone).toBe('+91 90000 77777');
    expect(row!.profile).toBe('admin');
  });

  it('rejects a staff member with no name (422)', async () => {
    const res = await client.post('/staff', { email: 'noname.staff@example.test' });
    expect(res.status).toBe(422);
  });
});
