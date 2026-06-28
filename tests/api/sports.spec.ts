import { describe, it, expect, inject, beforeAll } from 'vitest';
import { authedApi, type ApiClient } from '../helpers/api';

// Sports are inter-club matches: schedule a match between two clubs, record
// results tied to clubs, and the leaderboard ranks CLUBS by points.
describe('API · sports as inter-club matches', () => {
  let client: ApiClient;
  let eventId: number;
  let clubA: number;
  let clubB: number;
  const stamp = Date.now();

  beforeAll(async () => {
    client = await authedApi(inject('baseUrl'));
    clubA = (await client.post<{ id: number }>('/clubs', { name: `Falcons-${stamp}` })).body.id;
    clubB = (await client.post<{ id: number }>('/clubs', { name: `Tigers-${stamp}` })).body.id;
  });

  it('schedules a match between two clubs and reports the matchup', async () => {
    const res = await client.post<{ ok: boolean; id: number }>('/sports/events', {
      name: `Football Final ${stamp}`, sport: 'Football', event_date: '2026-08-10',
      home_club_id: clubA, away_club_id: clubB,
    });
    expect(res.status).toBe(201);
    eventId = res.body.id;
    const list = await client.get<{ events: { id: number; home_club: string; away_club: string }[] }>('/sports/events');
    const ev = list.body.events.find((e) => e.id === eventId);
    expect(ev?.home_club).toBe(`Falcons-${stamp}`);
    expect(ev?.away_club).toBe(`Tigers-${stamp}`);
  });

  it('records club-linked results and returns the club name', async () => {
    await client.post('/sports/results', { event_id: eventId, participant: 'Falcons A', club_id: clubA, position: 1, points: 10 });
    await client.post('/sports/results', { event_id: eventId, participant: 'Tigers A', club_id: clubB, position: 2, points: 5 });
    const r = await client.get<{ results: { club: string }[] }>(`/sports/results?event_id=${eventId}`);
    expect(r.body.results.some((x) => x.club === `Falcons-${stamp}`)).toBe(true);
  });

  it('leaderboard ranks CLUBS by points (winner club first)', async () => {
    const lb = await client.get<{ clubs: { club_id: number; club: string; points: number }[] }>('/sports/leaderboard');
    const a = lb.body.clubs.find((c) => c.club_id === clubA);
    const b = lb.body.clubs.find((c) => c.club_id === clubB);
    expect(a?.points).toBe(10);
    expect(b?.points).toBe(5);
    expect(lb.body.clubs.findIndex((c) => c.club_id === clubA))
      .toBeLessThan(lb.body.clubs.findIndex((c) => c.club_id === clubB));
  });
});
