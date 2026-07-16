/**
 * Tracking & metrics — derives dashboard numbers from events / session summaries.
 * Parallelism index, streaks, interference cost, daily rollups.
 */

import { format, subDays, parseISO, isSameDay } from 'date-fns';
import type { DailyMetrics, Rank, SessionSummary } from '../core';
import { RANK_STREAMS } from '../core';

export function dateKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function computeStreak(practiceDates: string[], today = dateKey()): number {
  if (practiceDates.length === 0) return 0;
  const set = new Set(practiceDates);
  let streak = 0;
  let cursor = parseISO(today);

  if (!set.has(today)) {
    cursor = subDays(cursor, 1);
    if (!set.has(format(cursor, 'yyyy-MM-dd'))) return 0;
  }

  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function rankFromParallelism(index: number): Rank {
  if (index >= 16) return 'shatavadhani';
  if (index >= 8) return 'ashtavadhani';
  if (index >= 4) return 'chatur_avadhani';
  if (index >= 2) return 'dvi_avadhani';
  return 'ekavadhani';
}

export function rankProgress(parallelismIndex: number): {
  rank: Rank;
  streams: number;
  nextStreams: number | null;
  progressToNext: number;
} {
  const rank = rankFromParallelism(parallelismIndex);
  const streams = RANK_STREAMS[rank];
  const order: Rank[] = [
    'ekavadhani',
    'dvi_avadhani',
    'chatur_avadhani',
    'ashtavadhani',
    'shatavadhani',
  ];
  const idx = order.indexOf(rank);
  const next = idx < order.length - 1 ? order[idx + 1] : null;
  const nextStreams = next ? RANK_STREAMS[next] : null;
  const progressToNext =
    nextStreams == null
      ? 1
      : Math.min(
          1,
          Math.max(
            0,
            (parallelismIndex - streams) / Math.max(1, nextStreams - streams) ||
              parallelismIndex / nextStreams,
          ),
        );

  return { rank, streams, nextStreams, progressToNext };
}

/**
 * Interference cost: solo accuracy − parallel accuracy for the same drill.
 * Positive = performance dropped under load (true avadhana skill gap).
 */
export function interferenceCost(
  soloAccuracy: number,
  parallelAccuracy: number,
): number {
  return soloAccuracy - parallelAccuracy;
}

/**
 * For each drill in a parallel session, compare against best recent solo accuracy.
 */
export function computeSessionInterference(
  parallelSession: SessionSummary,
  history: SessionSummary[],
): { perDrill: Record<string, number>; average: number } {
  if (parallelSession.mode !== 'avadhana') {
    return { perDrill: {}, average: 0 };
  }

  const soloByDrill: Record<string, number[]> = {};
  for (const s of history) {
    if (s.mode !== 'solo') continue;
    for (const [drillId, score] of Object.entries(s.scores)) {
      if (drillId.startsWith('__')) continue;
      if (!soloByDrill[drillId]) soloByDrill[drillId] = [];
      soloByDrill[drillId].push(score.accuracy);
    }
  }

  const perDrill: Record<string, number> = {};
  let sum = 0;
  let n = 0;
  for (const [drillId, score] of Object.entries(parallelSession.scores)) {
    if (drillId.startsWith('__')) continue;
    const solos = soloByDrill[drillId];
    if (!solos || solos.length === 0) continue;
    const bestSolo = Math.max(...solos);
    const cost = interferenceCost(bestSolo, score.accuracy);
    perDrill[drillId] = cost;
    sum += cost;
    n += 1;
  }

  return { perDrill, average: n ? sum / n : 0 };
}

export function summarizeWeek(
  sessions: SessionSummary[],
  fromDate: Date = subDays(new Date(), 6),
): {
  totalMinutes: number;
  sessions: number;
  avgAccuracy: number;
  maxParallelism: number;
  avgInterference: number;
  byDay: { date: string; minutes: number; sessions: number }[];
} {
  const days: { date: string; minutes: number; sessions: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = subDays(new Date(), 6 - i);
    days.push({ date: dateKey(d), minutes: 0, sessions: 0 });
  }

  let totalMs = 0;
  let accSum = 0;
  let maxP = 0;
  let n = 0;
  let intSum = 0;
  let intN = 0;

  for (const s of sessions) {
    const d = new Date(s.endedAt || s.startedAt);
    if (d < fromDate) continue;
    n += 1;
    totalMs += s.durationMs;
    accSum += s.overallAccuracy;
    maxP = Math.max(maxP, s.parallelismIndex);
    if (s.interferenceCost != null) {
      intSum += s.interferenceCost;
      intN += 1;
    }
    const key = dateKey(d);
    const bucket = days.find((x) => x.date === key);
    if (bucket) {
      bucket.minutes += s.durationMs / 60000;
      bucket.sessions += 1;
    }
  }

  return {
    totalMinutes: totalMs / 60000,
    sessions: n,
    avgAccuracy: n ? accSum / n : 0,
    maxParallelism: maxP,
    avgInterference: intN ? intSum / intN : 0,
    byDay: days,
  };
}

export function buildDailyMetrics(
  userId: string,
  date: string,
  sessions: SessionSummary[],
  streakDay: number,
): DailyMetrics {
  const daySessions = sessions.filter((s) =>
    isSameDay(new Date(s.endedAt || s.startedAt), parseISO(date)),
  );
  let minutes = 0;
  let acc = 0;
  let maxP = 0;
  const drillStats: DailyMetrics['drillStats'] = {};

  for (const s of daySessions) {
    minutes += s.durationMs / 60000;
    acc += s.overallAccuracy;
    maxP = Math.max(maxP, s.parallelismIndex);
    for (const [drillId, score] of Object.entries(s.scores)) {
      if (drillId.startsWith('__')) continue;
      if (!drillStats[drillId]) {
        drillStats[drillId] = { accuracy: 0, rounds: 0, bestLevel: 0 };
      }
      const st = drillStats[drillId];
      st.rounds += 1;
      st.accuracy = (st.accuracy * (st.rounds - 1) + score.accuracy) / st.rounds;
      const level = Number(
        score.details.spanLength ?? score.details.n ?? score.details.itemCount ?? 0,
      );
      st.bestLevel = Math.max(st.bestLevel, level);
    }
  }

  return {
    date,
    userId,
    minutesPracticed: minutes,
    sessionsCompleted: daySessions.length,
    overallAccuracy: daySessions.length ? acc / daySessions.length : 0,
    parallelismIndex: maxP,
    streakDay,
    drillStats,
  };
}
