import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10);

describe('API · exam archive retention', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
  });

  it('flags an item past its retention date as Due for disposal', async () => {
    await client.post('/exam-archives', { academic_year: '2024-25', exam_name: 'Mid Term', material_type: 'Answer Scripts', retention_until: iso(-3) });
    await client.post('/exam-archives', { academic_year: '2026-27', exam_name: 'Final', material_type: 'Question Paper', retention_until: iso(300) });

    const res = await client.get<{ archives: { exam_name: string; status: string }[]; due: number }>('/exam-archives');
    expect(res.status).toBe(200);
    expect(res.body.archives.find((a) => a.exam_name === 'Mid Term')!.status).toBe('Due for disposal');
    expect(res.body.archives.find((a) => a.exam_name === 'Final')!.status).toBe('Retained');
    expect(res.body.due).toBeGreaterThanOrEqual(1);
  });

  it('disposes an item (audited) and marks it Disposed', async () => {
    const add = await client.post<{ id: number }>('/exam-archives', { academic_year: '2023-24', exam_name: 'Old Practical', material_type: 'Practical Record', retention_until: iso(-30) });
    const id = add.body.id;
    const disp = await client.post(`/exam-archives/${id}/dispose`, {});
    expect(disp.status).toBe(200);
    const res = await client.get<{ archives: { id: number; status: string; disposed: boolean }[] }>('/exam-archives');
    const row = res.body.archives.find((a) => a.id === id)!;
    expect(row.status).toBe('Disposed');
    expect(row.disposed).toBe(true);
  });
});
