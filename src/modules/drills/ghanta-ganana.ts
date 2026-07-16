/**
 * Ghanta-ganana — bell count in the background.
 * Signature avadhana attention task: count random bells, report at end.
 *
 * When used solo: standalone timed bell stream.
 * When parallelSafe: session orchestrator injects bells via background events.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngInt,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';

function ladder(): Difficulty[] {
  return [
    { level: 0, label: 'Gentle (30s, 3–6 bells)', params: { durationMs: 30000, minBells: 3, maxBells: 6, minGapMs: 3000 } },
    { level: 1, label: 'Steady (45s, 5–10)', params: { durationMs: 45000, minBells: 5, maxBells: 10, minGapMs: 2500 } },
    { level: 2, label: 'Busy (60s, 8–15)', params: { durationMs: 60000, minBells: 8, maxBells: 15, minGapMs: 2000 } },
    { level: 3, label: 'Dense (75s, 12–20)', params: { durationMs: 75000, minBells: 12, maxBells: 20, minGapMs: 1500 } },
    { level: 4, label: 'Master (90s, 15–28)', params: { durationMs: 90000, minBells: 15, maxBells: 28, minGapMs: 1200 } },
    { level: 5, label: 'Extreme (120s, 20–40)', params: { durationMs: 120000, minBells: 20, maxBells: 40, minGapMs: 1000 } },
  ];
}

/** Generate bell timestamps for a session window (used by orchestrator too) */
export function generateBellSchedule(
  seed: string,
  durationMs: number,
  minBells: number,
  maxBells: number,
  minGapMs: number,
): number[] {
  const rng = createRng(seed);
  const count = rngInt(rng, minBells, maxBells);
  const times: number[] = [];
  let t = rngInt(rng, 800, Math.max(800, Math.floor(durationMs * 0.15)));
  for (let i = 0; i < count && t < durationMs - 500; i++) {
    times.push(t);
    t += minGapMs + rngInt(rng, 0, minGapMs * 2);
  }
  return times;
}

export const ghantaGananaDrill: Drill = {
  meta: {
    id: 'ghanta_ganana',
    name: 'Ghanta-ganana',
    shortName: 'Ghanta',
    description:
      'Bells ring at random intervals. Count them silently; report the total at the end.',
    pillar: 'dharana',
    parallelSafe: true,
    icon: '🔔',
    phase: 1,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const durationMs = Number(difficulty.params.durationMs) || 30000;
    const minBells = Number(difficulty.params.minBells) || 3;
    const maxBells = Number(difficulty.params.maxBells) || 6;
    const minGapMs = Number(difficulty.params.minGapMs) || 3000;

    const schedule = generateBellSchedule(seed, durationMs, minBells, maxBells, minGapMs);
    const trueCount = schedule.length;

    const prompts = [
      {
        id: createPromptId(),
        kind: 'bell_listen',
        instruction: 'Listen carefully. Count every bell. Do not tap — only listen.',
        payload: {
          phase: 'listen',
          durationMs,
          schedule,
          // schedule is in payload for the audio module; UI should not display count
        },
        timeLimitMs: durationMs,
      },
      {
        id: createPromptId(),
        kind: 'bell_report',
        instruction: 'How many bells did you hear?',
        payload: { phase: 'report' },
      },
    ];

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { trueCount, schedule },
      meta: { durationMs, trueCount },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const trueCount = Number(round.expected.trueCount) || 0;
    const report = responses.find((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind === 'bell_report';
    });
    const guessed = parseInt(String(report?.value ?? ''), 10);
    const correct = !Number.isNaN(guessed) && guessed === trueCount ? 1 : 0;
    const error = Number.isNaN(guessed) ? trueCount : Math.abs(guessed - trueCount);

    // Partial credit: within 1 = half, exact = full
    let partial = 0;
    if (correct) partial = 1;
    else if (error === 1) partial = 0.5;
    else if (error === 2) partial = 0.25;

    return buildScore(
      partial >= 1 ? 1 : 0,
      1,
      {
        trueCount,
        guessed: Number.isNaN(guessed) ? -1 : guessed,
        error,
        partialCredit: partial,
      },
      { up: 1, down: 0.5 },
    );
  },
};
