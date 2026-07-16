/**
 * Drill-as-plugin contract.
 *
 * Every practice activity implements `Drill`. New drills never require
 * engine changes — only a new plugin + registry registration.
 *
 * Module boundary: pure TypeScript, no React. UI lives in drill screens.
 */

import type { Difficulty, Pillar, Response, Round, Score } from './types';

export interface DrillMeta {
  id: string;
  name: string;
  shortName: string;
  description: string;
  pillar: Pillar;
  /** Can run inside a multi-stream Avadhana Session */
  parallelSafe: boolean;
  /** Icon glyph / emoji for catalog */
  icon: string;
  /** Phase when this drill ships */
  phase: 1 | 2 | 3 | 4;
  /** Whether MVP ships this drill */
  enabled: boolean;
}

/**
 * Plugin interface — implement this for each drill.
 */
export interface Drill {
  meta: DrillMeta;

  /** Ordered difficulty ladder (index = level) */
  difficultyLadder: Difficulty[];

  /**
   * Generate a practice round.
   * @param difficulty - current ladder entry
   * @param seed - deterministic seed for reproducibility / sync
   */
  generateRound(difficulty: Difficulty, seed: string): Round;

  /**
   * Score user responses against the round's expected answers.
   */
  score(round: Round, responses: Response[]): Score;

  /**
   * Optional: adapt difficulty after a score.
   * Default uses score.difficultyDelta.
   */
  nextDifficulty?(current: Difficulty, score: Score): Difficulty;
}

/** Default difficulty stepper using ladder */
export function stepDifficulty(
  drill: Drill,
  current: Difficulty,
  delta: -1 | 0 | 1,
): Difficulty {
  const idx = drill.difficultyLadder.findIndex((d) => d.level === current.level);
  const next = Math.max(0, Math.min(drill.difficultyLadder.length - 1, (idx < 0 ? 0 : idx) + delta));
  return drill.difficultyLadder[next];
}

/** Helper to build a standard accuracy-based score */
export function buildScore(
  correct: number,
  total: number,
  details: Score['details'] = {},
  thresholds: { up: number; down: number } = { up: 0.9, down: 0.6 },
): Score {
  const accuracy = total === 0 ? 0 : correct / total;
  let difficultyDelta: -1 | 0 | 1 = 0;
  if (accuracy >= thresholds.up) difficultyDelta = 1;
  else if (accuracy < thresholds.down) difficultyDelta = -1;
  return { correct, total, accuracy, details, difficultyDelta };
}
