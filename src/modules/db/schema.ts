/**
 * SQL schema — every row carries user_id for multi-user readiness (phase 3).
 * Event log is append-only; metrics_daily is a rollup cache.
 */

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'ekavadhani',
  created_at INTEGER NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  drill_ids_json TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_ms INTEGER,
  overall_accuracy REAL,
  parallelism_index INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  journal TEXT,
  summary_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  drill_id TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  seed TEXT NOT NULL,
  score_json TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  round_id TEXT,
  drill_id TEXT,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS drill_progress (
  user_id TEXT NOT NULL,
  drill_id TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 0,
  best_accuracy REAL DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, drill_id)
);

CREATE TABLE IF NOT EXISTS srs_cards (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  content_pack_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 5,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL,
  last_review_at INTEGER,
  state TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS content_packs (
  id TEXT PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL,
  kind TEXT NOT NULL,
  language TEXT,
  payload_json TEXT NOT NULL,
  installed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics_daily (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  minutes_practiced REAL NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  overall_accuracy REAL NOT NULL DEFAULT 0,
  parallelism_index INTEGER NOT NULL DEFAULT 0,
  streak_day INTEGER NOT NULL DEFAULT 0,
  drill_stats_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(user_id, due_at);
`;
