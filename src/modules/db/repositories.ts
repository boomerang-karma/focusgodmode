/**
 * Repositories — one module boundary per table group.
 * Enhance persistence here without touching drills or UI.
 */

import {
  createUserId,
  type PracticeEvent,
  type Rank,
  type SessionSummary,
  type UserProfile,
  type UserSettings,
} from '../core';
import {
  computeSessionInterference,
  computeStreak,
  dateKey,
  rankFromParallelism,
} from '../tracking';
import { getAll, getFirst, run } from './client';

const DEFAULT_SETTINGS: UserSettings = {
  dailyReminderEnabled: true,
  dailyReminderHour: 6,
  dailyReminderMinute: 30,
  soundEnabled: true,
  speechEnabled: true,
  language: 'en',
  selfScoreSahitya: true,
};

// ─── Users ───────────────────────────────────────────────────────────────────

export async function ensureLocalUser(displayName = 'Sadhaka'): Promise<UserProfile> {
  const existing = await getFirst<{
    id: string;
    display_name: string;
    rank: string;
    created_at: number;
    settings_json: string;
  }>('SELECT * FROM users LIMIT 1');

  if (existing) {
    return {
      id: existing.id,
      displayName: existing.display_name,
      rank: existing.rank as Rank,
      createdAt: existing.created_at,
      settings: { ...DEFAULT_SETTINGS, ...JSON.parse(existing.settings_json || '{}') },
    };
  }

  const profile: UserProfile = {
    id: createUserId(),
    displayName,
    rank: 'ekavadhani',
    createdAt: Date.now(),
    settings: DEFAULT_SETTINGS,
  };

  await run(
    `INSERT INTO users (id, display_name, rank, created_at, settings_json) VALUES (?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.displayName,
      profile.rank,
      profile.createdAt,
      JSON.stringify(profile.settings),
    ],
  );

  return profile;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<UserSettings> {
  const user = await ensureLocalUser();
  const next = { ...user.settings, ...settings };
  await run(`UPDATE users SET settings_json = ? WHERE id = ?`, [JSON.stringify(next), userId]);
  return next;
}

export async function updateUserRank(userId: string, rank: Rank): Promise<void> {
  await run(`UPDATE users SET rank = ? WHERE id = ?`, [rank, userId]);
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function appendEvent(event: PracticeEvent): Promise<void> {
  await run(
    `INSERT INTO events (id, user_id, session_id, round_id, drill_id, type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.userId,
      event.sessionId,
      event.roundId ?? null,
      event.drillId ?? null,
      event.type,
      JSON.stringify(event.payload),
      event.createdAt,
    ],
  );
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function saveSessionSummary(
  userId: string,
  summary: SessionSummary,
  journal?: string,
  status: string = 'completed',
): Promise<void> {
  // Interference cost vs historical solo baselines
  let enriched = { ...summary };
  if (summary.mode === 'avadhana') {
    const history = await getRecentSessions(userId, 50);
    const { average } = computeSessionInterference(summary, history);
    enriched = { ...summary, interferenceCost: average };
  }

  await run(
    `INSERT OR REPLACE INTO sessions
     (id, user_id, mode, drill_ids_json, started_at, ended_at, duration_ms,
      overall_accuracy, parallelism_index, status, journal, summary_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      enriched.sessionId,
      userId,
      enriched.mode,
      JSON.stringify(enriched.drillIds),
      enriched.startedAt,
      enriched.endedAt,
      enriched.durationMs,
      enriched.overallAccuracy,
      enriched.parallelismIndex,
      status,
      journal ?? null,
      JSON.stringify(enriched),
    ],
  );

  // Update drill progress
  for (const [drillId, score] of Object.entries(enriched.scores)) {
    if (drillId.startsWith('__')) continue;
    const prev = await getFirst<{
      difficulty_level: number;
      best_accuracy: number;
      total_rounds: number;
    }>(`SELECT * FROM drill_progress WHERE user_id = ? AND drill_id = ?`, [userId, drillId]);

    const totalRounds = (prev?.total_rounds ?? 0) + 1;
    const bestAccuracy = Math.max(prev?.best_accuracy ?? 0, score.accuracy);
    const levelBump = score.difficultyDelta > 0 ? 1 : score.difficultyDelta < 0 ? -1 : 0;
    const difficultyLevel = Math.max(0, (prev?.difficulty_level ?? 0) + levelBump);

    await run(
      `INSERT OR REPLACE INTO drill_progress
       (user_id, drill_id, difficulty_level, best_accuracy, total_rounds, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, drillId, difficultyLevel, bestAccuracy, totalRounds, Date.now()],
    );
  }

  // Rollup daily metrics + streak
  await refreshDailyMetrics(userId);

  // Rank from max parallelism
  const maxP = await getMaxParallelism(userId);
  await updateUserRank(userId, rankFromParallelism(maxP));
}

export async function getRecentSessions(
  userId: string,
  limit = 30,
): Promise<SessionSummary[]> {
  const rows = await getAll<{ summary_json: string }>(
    `SELECT summary_json FROM sessions WHERE user_id = ? AND status = 'completed'
     ORDER BY started_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => JSON.parse(r.summary_json) as SessionSummary);
}

export async function getMaxParallelism(userId: string): Promise<number> {
  const row = await getFirst<{ m: number | null }>(
    `SELECT MAX(parallelism_index) as m FROM sessions WHERE user_id = ? AND status = 'completed'`,
    [userId],
  );
  return row?.m ?? 0;
}

export async function getDrillProgress(
  userId: string,
): Promise<Record<string, { difficultyLevel: number; bestAccuracy: number; totalRounds: number }>> {
  const rows = await getAll<{
    drill_id: string;
    difficulty_level: number;
    best_accuracy: number;
    total_rounds: number;
  }>(`SELECT * FROM drill_progress WHERE user_id = ?`, [userId]);

  const out: Record<string, { difficultyLevel: number; bestAccuracy: number; totalRounds: number }> =
    {};
  for (const r of rows) {
    out[r.drill_id] = {
      difficultyLevel: r.difficulty_level,
      bestAccuracy: r.best_accuracy,
      totalRounds: r.total_rounds,
    };
  }
  return out;
}

export async function getPracticeDates(userId: string): Promise<string[]> {
  const rows = await getAll<{ d: string }>(
    `SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') as d
     FROM sessions WHERE user_id = ? AND status = 'completed' ORDER BY d DESC`,
    [userId],
  );
  return rows.map((r) => r.d);
}

export async function getStreak(userId: string): Promise<number> {
  const dates = await getPracticeDates(userId);
  return computeStreak(dates);
}

export async function refreshDailyMetrics(userId: string): Promise<void> {
  const today = dateKey();
  const sessions = await getRecentSessions(userId, 100);
  const streak = await getStreak(userId);
  const daySessions = sessions.filter((s) => {
    const d = new Date(s.endedAt || s.startedAt);
    return dateKey(d) === today;
  });

  let minutes = 0;
  let acc = 0;
  let maxP = 0;
  const drillStats: Record<string, { accuracy: number; rounds: number; bestLevel: number }> = {};

  for (const s of daySessions) {
    minutes += s.durationMs / 60000;
    acc += s.overallAccuracy;
    maxP = Math.max(maxP, s.parallelismIndex);
    for (const [drillId, score] of Object.entries(s.scores)) {
      if (!drillStats[drillId]) {
        drillStats[drillId] = { accuracy: 0, rounds: 0, bestLevel: 0 };
      }
      const st = drillStats[drillId];
      st.rounds += 1;
      st.accuracy = (st.accuracy * (st.rounds - 1) + score.accuracy) / st.rounds;
    }
  }

  await run(
    `INSERT OR REPLACE INTO metrics_daily
     (user_id, date, minutes_practiced, sessions_completed, overall_accuracy,
      parallelism_index, streak_day, drill_stats_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      today,
      minutes,
      daySessions.length,
      daySessions.length ? acc / daySessions.length : 0,
      maxP,
      streak,
      JSON.stringify(drillStats),
    ],
  );
}

export async function getDashboardStats(userId: string): Promise<{
  streak: number;
  maxParallelism: number;
  totalSessions: number;
  totalMinutes: number;
  recentSessions: SessionSummary[];
  drillProgress: Record<string, { difficultyLevel: number; bestAccuracy: number; totalRounds: number }>;
}> {
  const [streak, maxParallelism, recentSessions, drillProgress, countRow, minutesRow] =
    await Promise.all([
      getStreak(userId),
      getMaxParallelism(userId),
      getRecentSessions(userId, 14),
      getDrillProgress(userId),
      getFirst<{ c: number }>(
        `SELECT COUNT(*) as c FROM sessions WHERE user_id = ? AND status = 'completed'`,
        [userId],
      ),
      getFirst<{ m: number | null }>(
        `SELECT SUM(duration_ms) as m FROM sessions WHERE user_id = ? AND status = 'completed'`,
        [userId],
      ),
    ]);

  return {
    streak,
    maxParallelism,
    totalSessions: countRow?.c ?? 0,
    totalMinutes: (minutesRow?.m ?? 0) / 60000,
    recentSessions,
    drillProgress,
  };
}

export async function getJournalEntries(
  userId: string,
  limit = 50,
): Promise<{ sessionId: string; journal: string; startedAt: number }[]> {
  const rows = await getAll<{ id: string; journal: string; started_at: number }>(
    `SELECT id, journal, started_at FROM sessions
     WHERE user_id = ? AND journal IS NOT NULL AND journal != ''
     ORDER BY started_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((r) => ({
    sessionId: r.id,
    journal: r.journal,
    startedAt: r.started_at,
  }));
}
