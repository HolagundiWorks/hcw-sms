import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

// Courses CRUD incl. delete. No per-id GET and no search — reads go through the
// full list (GET /courses → { courses:[{id,name,subjects}], total }).
interface CourseRow {
  id: number;
  name: string | null;
}

describe('API · courses CRUD', () => {
  let client: ApiClient;
  const name = `Course-${Date.now()}`;
  let createdId: number;

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
  });

  const list = () => client.get<{ courses: CourseRow[]; total: number }>('/courses');
  const findId = async (id: number) => (await list()).body.courses.find((c) => c.id === id);

  it('lists courses', async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.courses)).toBe(true);
  });

  it('creates a course (201)', async () => {
    const res = await client.post<{ ok: boolean; id: number }>('/courses', { name });
    expect(res.status).toBe(201);
    createdId = res.body.id;
    expect(await findId(createdId)).toBeDefined();
  });

  it('rejects a course with no name (422)', async () => {
    const res = await client.post('/courses', {});
    expect(res.status).toBe(422);
  });

  it('updates a course name', async () => {
    const upd = await client.post<{ ok: boolean }>(`/courses/${createdId}/update`, {
      name: `${name}-renamed`,
    });
    expect(upd.status).toBe(200);
    expect((await findId(createdId))?.name).toBe(`${name}-renamed`);
  });

  it('deletes a course', async () => {
    const del = await client.post<{ ok: boolean }>(`/courses/${createdId}/delete`, {});
    expect(del.status).toBe(200);
    expect(await findId(createdId)).toBeUndefined();
  });
});
