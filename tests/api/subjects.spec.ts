import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

// Subjects CRUD incl. delete. Reads via list/search (GET /subjects?q=).
interface SubjectRow {
  id: number;
  name: string | null;
  code: string | null;
}

describe('API · subjects CRUD', () => {
  let client: ApiClient;
  const name = `Subject-${Date.now()}`;
  let createdId: number;

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
  });

  const search = (q: string) => client.get<{ subjects: SubjectRow[] }>(`/subjects?q=${encodeURIComponent(q)}`);
  const findId = async (q: string, id: number) => (await search(q)).body.subjects.find((s) => s.id === id);

  it('lists subjects', async () => {
    const res = await client.get<{ subjects: SubjectRow[]; total: number }>('/subjects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.subjects)).toBe(true);
  });

  it('creates a subject (201)', async () => {
    const res = await client.post<{ ok: boolean; id: number }>('/subjects', {
      name,
      code: 'TST',
      type: 'Core',
      weekly_periods: 5,
    });
    expect(res.status).toBe(201);
    createdId = res.body.id;
    expect(await findId(name, createdId)).toBeDefined();
  });

  it('rejects a subject with no name (422)', async () => {
    const res = await client.post('/subjects', { code: 'X' });
    expect(res.status).toBe(422);
  });

  it('updates a subject name and code', async () => {
    const upd = await client.post<{ ok: boolean }>(`/subjects/${createdId}/update`, {
      name: `${name}-v2`,
      code: 'TS2',
    });
    expect(upd.status).toBe(200);
    const row = await findId(`${name}-v2`, createdId);
    expect(row?.code).toBe('TS2');
  });

  it('deletes a subject', async () => {
    const del = await client.post<{ ok: boolean }>(`/subjects/${createdId}/delete`, {});
    expect(del.status).toBe(200);
    expect(await findId(`${name}-v2`, createdId)).toBeUndefined();
  });
});
