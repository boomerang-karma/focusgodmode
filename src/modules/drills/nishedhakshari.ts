/**
 * Nishedhakshari — compose letter-by-letter while forbidden letters accumulate.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngPick,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';

const FORBIDDEN_POOL = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '2 forbidden · short line', params: { forbidCount: 2, minChars: 12, timeLimitMs: 120000 } },
    { level: 1, label: '3 forbidden', params: { forbidCount: 3, minChars: 16, timeLimitMs: 120000 } },
    { level: 2, label: '4 forbidden · longer', params: { forbidCount: 4, minChars: 24, timeLimitMs: 150000 } },
    { level: 3, label: '5 forbidden · strict', params: { forbidCount: 5, minChars: 30, timeLimitMs: 150000 } },
    { level: 4, label: '6 forbidden · master', params: { forbidCount: 6, minChars: 40, timeLimitMs: 180000 } },
  ];
}

export const nishedhakshariDrill: Drill = {
  meta: {
    id: 'nishedhakshari',
    name: 'Nishedhakshari',
    shortName: 'Nishedha',
    description:
      'Compose a line while certain letters are forbidden. Avoid banned letters entirely.',
    pillar: 'sahitya',
    parallelSafe: true,
    icon: '🚫',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const forbidCount = Number(difficulty.params.forbidCount) || 3;
    const minChars = Number(difficulty.params.minChars) || 16;
    const timeLimitMs = Number(difficulty.params.timeLimitMs) || 120000;

    const forbidden: string[] = [];
    while (forbidden.length < forbidCount) {
      const L = rngPick(rng, FORBIDDEN_POOL);
      if (!forbidden.includes(L)) forbidden.push(L);
    }

    const topic = rngPick(rng, [
      'a river at dawn',
      'a silent temple',
      'the first monsoon',
      'a crow on a lamp-post',
      'memory of a teacher',
      'the sound of a bell',
    ]);

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts: [
        {
          id: createPromptId(),
          kind: 'nishedha_compose',
          instruction: `Write a line on “${topic}” without using: ${forbidden.join(', ')}`,
          payload: {
            phase: 'compose',
            topic,
            forbidden,
            minChars,
          },
          timeLimitMs,
        },
      ],
      expected: { forbidden, minChars, topic },
      meta: { forbidden, topic },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const text = String(responses[0]?.value ?? '');
    const forbidden = (round.expected.forbidden as string[]) || [];
    const minChars = Number(round.expected.minChars) || 16;
    const upper = text.toUpperCase();
    let violations = 0;
    for (const L of forbidden) {
      const re = new RegExp(L, 'g');
      const m = upper.match(re);
      if (m) violations += m.length;
    }
    const longEnough = text.replace(/\s/g, '').length >= minChars;
    const clean = violations === 0;
    const correct = (clean ? 1 : 0) + (longEnough ? 1 : 0);
    return buildScore(correct, 2, {
      violations,
      length: text.length,
      clean,
      longEnough,
    });
  },
};
