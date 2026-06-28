import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

// Student documents repository: add → list (metadata) → fetch data → verify → delete.
describe('API · student documents repository', () => {
  let client: ApiClient;
  let studentId: number;
  const stamp = Date.now();
  const tinyPdf = 'data:application/pdf;base64,JVBERi0xLjQK'; // header only — enough to round-trip

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
    const s = await client.post<{ id: number }>('/students', { first_name: 'Doc', last_name: `Holder-${stamp}` });
    studentId = s.body.id;
  });

  it('adds a document and lists it (metadata only, no blob)', async () => {
    const add = await client.post<{ ok: boolean; id: number }>('/student-documents', {
      student_id: studentId, doc_type: 'Birth Certificate', file_name: 'birth.pdf', mime: 'application/pdf', data: tinyPdf,
    });
    expect(add.status).toBe(201);

    const list = await client.get<{ documents: { id: number; doc_type: string; verified: boolean; data?: string }[]; total: number }>(
      `/student-documents?student_id=${studentId}`,
    );
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.documents[0].doc_type).toBe('Birth Certificate');
    expect(list.body.documents[0].data).toBeUndefined(); // list stays light
  });

  it('fetches the document blob, verifies, then deletes', async () => {
    const list = await client.get<{ documents: { id: number }[] }>(`/student-documents?student_id=${studentId}`);
    const id = list.body.documents[0].id;

    const full = await client.get<{ document: { data: string; verified: boolean } }>(`/student-documents/${id}`);
    expect(full.body.document.data).toBe(tinyPdf);

    const verify = await client.post(`/student-documents/${id}/verify`, { verified: true });
    expect(verify.status).toBe(200);
    const afterVerify = await client.get<{ document: { verified: boolean } }>(`/student-documents/${id}`);
    expect(afterVerify.body.document.verified).toBe(true);

    const del = await client.post(`/student-documents/${id}/delete`, {});
    expect(del.status).toBe(200);
    const empty = await client.get<{ total: number }>(`/student-documents?student_id=${studentId}`);
    expect(empty.body.total).toBe(0);
  });
});
