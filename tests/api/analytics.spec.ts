import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

describe('API · learning analytics', () => {
  let client: ApiClient;
  let studentId: number;
  const stamp = Date.now();

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
    const s = await client.post<{ id: number }>('/students', { first_name: 'Insight', last_name: `Subject-${stamp}` });
    studentId = s.body.id;
  });

  it('returns an empty-but-valid shape before any scores', async () => {
    const res = await client.get<{ overall_pct: number | null; subjects: unknown[]; summary: string }>(`/students/${studentId}/analytics`);
    expect(res.status).toBe(200);
    expect(res.body.overall_pct).toBeNull();
    expect(res.body.subjects).toHaveLength(0);
    expect(res.body.summary).toContain('No scores recorded');
  });

  it('maps strengths/weaknesses and a declining trend from scores', async () => {
    // Strong, steady subject.
    await client.post('/student-marks', { student_id: studentId, term: 'Unit Test 1', subject: 'Maths', max_marks: 100, marks: 92 });
    await client.post('/student-marks', { student_id: studentId, term: 'Mid Term', subject: 'Maths', max_marks: 100, marks: 90 });
    // Weak + declining subject.
    await client.post('/student-marks', { student_id: studentId, term: 'Unit Test 1', subject: 'Science', max_marks: 100, marks: 45 });
    await client.post('/student-marks', { student_id: studentId, term: 'Mid Term', subject: 'Science', max_marks: 100, marks: 30 });

    const res = await client.get<{
      overall_pct: number;
      subjects: { subject: string; avg_pct: number; trend: string }[];
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    }>(`/students/${studentId}/analytics`);

    expect(res.status).toBe(200);
    expect(res.body.strengths).toContain('Maths');
    expect(res.body.weaknesses).toContain('Science');
    const science = res.body.subjects.find((s) => s.subject === 'Science')!;
    expect(science.trend).toBe('declining');
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    // Maths(91) + Science(37.5) → ~64
    expect(res.body.overall_pct).toBeGreaterThan(50);
    expect(res.body.overall_pct).toBeLessThan(75);
  });
});
