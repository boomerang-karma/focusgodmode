/**
 * Schulte tables — find numbers 1..N in order on a grid (attention + visual scan).
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngShuffle,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '3×3 (1–9)', params: { size: 3, timeLimitMs: 30000 } },
    { level: 1, label: '4×4 (1–16)', params: { size: 4, timeLimitMs: 45000 } },
    { level: 2, label: '5×5 (1–25)', params: { size: 5, timeLimitMs: 60000 } },
    { level: 3, label: '5×5 faster', params: { size: 5, timeLimitMs: 45000 } },
    { level: 4, label: '6×6 (1–36)', params: { size: 6, timeLimitMs: 90000 } },
  ];
}

export const schulteDrill: Drill = {
  meta: {
    id: 'schulte',
    name: 'Schulte Tables',
    shortName: 'Schulte',
    description: 'Tap numbers in ascending order as fast as you can. Classic attention scan.',
    pillar: 'dharana',
    parallelSafe: false,
    icon: '🔲',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const size = Number(difficulty.params.size) || 4;
    const n = size * size;
    const timeLimitMs = Number(difficulty.params.timeLimitMs) || 45000;
    const cells = rngShuffle(
      rng,
      Array.from({ length: n }, (_, i) => i + 1),
    );

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts: [
        {
          id: createPromptId(),
          kind: 'schulte_grid',
          instruction: `Tap 1 → ${n} in order`,
          payload: { phase: 'grid', size, cells, targetStart: 1 },
          timeLimitMs,
        },
      ],
      expected: { sequence: Array.from({ length: n }, (_, i) => i + 1), n },
      meta: { size, n },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const n = Number(round.expected.n) || 0;
    // value: { taps: number[], completed: boolean, elapsedMs: number }
    const val = (responses[0]?.value as {
      taps?: number[];
      completed?: boolean;
      elapsedMs?: number;
    }) || {};
    const taps = val.taps || [];
    let correct = 0;
    for (let i = 0; i < n; i++) {
      if (taps[i] === i + 1) correct += 1;
      else break; // order must be sequential
    }
    // If they reported full correct sequence
    if (val.completed && correct === n) {
      /* full */
    }
    return buildScore(correct, n, {
      elapsedMs: val.elapsedMs ?? 0,
      completed: Boolean(val.completed),
    });
  },
};
