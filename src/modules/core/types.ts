/**
 * Core domain types for Avadhan Vidya.
 * Every drill, session, and metric builds on these contracts.
 * Keep this module free of React/UI so drills stay pure and testable.
 */

/** Practice pillar from the tradition */
export type Pillar = 'smriti' | 'sahitya' | 'dharana';

/** Progression identity */
export type Rank =
  | 'ekavadhani'
  | 'dvi_avadhani'
  | 'chatur_avadhani'
  | 'ashtavadhani'
  | 'shatavadhani';

export const RANK_LABELS: Record<Rank, string> = {
  ekavadhani: 'Ekavadhani (1)',
  dvi_avadhani: 'Dvi-avadhani (2)',
  chatur_avadhani: 'Chatur-avadhani (4)',
  ashtavadhani: 'Ashtavadhani (8)',
  shatavadhani: 'Shatavadhani track',
};

export const RANK_STREAMS: Record<Rank, number> = {
  ekavadhani: 1,
  dvi_avadhani: 2,
  chatur_avadhani: 4,
  ashtavadhani: 8,
  shatavadhani: 16,
};

/** Adaptive difficulty level (0-based index into ladder) */
export interface Difficulty {
  level: number;
  label: string;
  /** Free-form params the drill interprets */
  params: Record<string, number | string | boolean>;
}

/** A single prompt presented to the practitioner */
export interface Prompt {
  id: string;
  kind: string;
  /** Human-readable instruction */
  instruction: string;
  /** Payload for the UI (items, digits, topic, etc.) */
  payload: Record<string, unknown>;
  /** Optional time limit in ms */
  timeLimitMs?: number;
  /** If true, response is deferred to recall phase */
  deferred?: boolean;
}

/** Practitioner response to a prompt */
export interface Response {
  promptId: string;
  /** Free-form answer payload */
  value: unknown;
  /** Client timestamp */
  respondedAt: number;
  /** Latency from prompt show → response */
  latencyMs?: number;
}

/** One generated round of a drill */
export interface Round {
  id: string;
  drillId: string;
  difficulty: Difficulty;
  seed: string;
  prompts: Prompt[];
  /** Ground truth for scoring (not shown to user during practice) */
  expected: Record<string, unknown>;
  /** Optional metadata for UI */
  meta?: Record<string, unknown>;
}

/** Score for a completed round */
export interface Score {
  correct: number;
  total: number;
  accuracy: number;
  /** Drill-specific metrics (span length, interference, etc.) */
  details: Record<string, number | string | boolean>;
  /** Suggest next difficulty delta: -1 | 0 | 1 */
  difficultyDelta: -1 | 0 | 1;
}

/** Append-only practice event (source of truth for metrics) */
export type EventType =
  | 'session_start'
  | 'session_end'
  | 'round_start'
  | 'round_end'
  | 'prompt_show'
  | 'prompt_response'
  | 'background_event'
  | 'recall_phase_start'
  | 'recall_phase_end'
  | 'heckler'
  | 'journal_entry'
  | 'difficulty_change';

export interface PracticeEvent {
  id: string;
  userId: string;
  sessionId: string;
  roundId?: string;
  drillId?: string;
  type: EventType;
  payload: Record<string, unknown>;
  createdAt: number;
}

export type SessionMode = 'solo' | 'avadhana';

export type SessionStatus =
  | 'pending'
  | 'active'
  | 'recall'
  | 'bell_report'
  | 'completed'
  | 'abandoned';

export interface SessionConfig {
  mode: SessionMode;
  drillIds: string[];
  /** Concurrent streams for avadhana mode */
  streamCount: number;
  /** Enable background bell (ghanta-ganana) */
  enableBell: boolean;
  /** Enable heckler interruptions */
  enableHeckler: boolean;
  /** Number of interleaved turns per stream in avadhana (default 1 full round each) */
  turnsPerStream?: number;
  seed?: string;
}

export interface SessionSummary {
  sessionId: string;
  mode: SessionMode;
  drillIds: string[];
  startedAt: number;
  endedAt: number;
  durationMs: number;
  overallAccuracy: number;
  parallelismIndex: number;
  scores: Record<string, Score>;
  eventCount: number;
  /** Accuracy drop under parallel load vs historical solo (if available) */
  interferenceCost?: number;
  /** Background bell report accuracy (avadhana) */
  bellAccuracy?: number;
  trueBellCount?: number;
  reportedBellCount?: number;
  deferredRecallAccuracy?: number;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  userId: string;
  minutesPracticed: number;
  sessionsCompleted: number;
  overallAccuracy: number;
  parallelismIndex: number;
  streakDay: number;
  drillStats: Record<string, { accuracy: number; rounds: number; bestLevel: number }>;
}

export interface UserProfile {
  id: string;
  displayName: string;
  rank: Rank;
  createdAt: number;
  settings: UserSettings;
}

export interface UserSettings {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  soundEnabled: boolean;
  speechEnabled: boolean;
  language: 'en' | 'hi' | 'gu' | 'sa';
  selfScoreSahitya: boolean;
}
