/**
 * TEMPLATE — copy this file to add a new drill module.
 *
 * Steps:
 * 1. Copy to `my-drill.ts` and implement `Drill`
 * 2. Export from `drills/index.ts` and call `registerDrill`
 * 3. (Optional) Add a specialized UI branch in `DrillRunner` for new prompt kinds
 * 4. Ship content via `assets/content/*.json` + content pack registration
 *
 * Never modify the session orchestrator unless you need a new scheduling policy.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';

export const templateDrill: Drill = {
  meta: {
    id: 'template_drill',
    name: 'Template Drill',
    shortName: 'Template',
    description: 'Scaffold only — disable until implemented.',
    pillar: 'dharana',
    parallelSafe: true,
    icon: '🧩',
    phase: 2,
    enabled: false, // flip to true when ready
  },

  difficultyLadder: [
    { level: 0, label: 'Intro', params: { n: 1 } },
    { level: 1, label: 'Standard', params: { n: 2 } },
  ],

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    void rng;
    const promptId = createPromptId();
    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts: [
        {
          id: promptId,
          kind: 'template_prompt',
          instruction: 'Implement me',
          payload: { phase: 'respond', n: difficulty.params.n },
        },
      ],
      expected: { answer: 'todo' },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const got = String(responses[0]?.value ?? '');
    const expected = String(round.expected.answer ?? '');
    const correct = got === expected ? 1 : 0;
    return buildScore(correct, 1);
  },
};
