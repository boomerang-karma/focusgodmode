/**
 * Datta-padi — compose using 4 given unrelated words.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngSample,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';
import { getWordPack } from '../content';

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '4 words · free form', params: { wordCount: 4, minLines: 2, timeLimitMs: 150000 } },
    { level: 1, label: '4 words · 3 lines', params: { wordCount: 4, minLines: 3, timeLimitMs: 150000 } },
    { level: 2, label: '5 words · 3 lines', params: { wordCount: 5, minLines: 3, timeLimitMs: 150000 } },
    { level: 3, label: '5 words · 4 lines', params: { wordCount: 5, minLines: 4, timeLimitMs: 120000 } },
    { level: 4, label: '6 words · tight time', params: { wordCount: 6, minLines: 4, timeLimitMs: 90000 } },
  ];
}

export const dattaPadiDrill: Drill = {
  meta: {
    id: 'datta_padi',
    name: 'Datta-padi',
    shortName: 'Datta',
    description: 'Compose a short verse that must include a set of unrelated given words.',
    pillar: 'sahitya',
    parallelSafe: true,
    icon: '📝',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const wordCount = Number(difficulty.params.wordCount) || 4;
    const minLines = Number(difficulty.params.minLines) || 3;
    const timeLimitMs = Number(difficulty.params.timeLimitMs) || 150000;
    const given = rngSample(rng, getWordPack().words, wordCount);

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts: [
        {
          id: createPromptId(),
          kind: 'datta_compose',
          instruction: `Use all given words in a ${minLines}+ line composition`,
          payload: { phase: 'compose', given, minLines },
          timeLimitMs,
        },
        {
          id: createPromptId(),
          kind: 'sahitya_self_score',
          instruction: 'Self-score craft',
          payload: {
            phase: 'self_score',
            criteria: [
              { id: 'all_words', label: 'All given words appear naturally' },
              { id: 'sense', label: 'Overall sense / story holds' },
              { id: 'craft', label: 'Readable rhythm or structure' },
            ],
          },
        },
      ],
      expected: { given, minLines },
      meta: { given },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const given = (round.expected.given as string[]) || [];
    const minLines = Number(round.expected.minLines) || 3;
    const text = String(
      responses.find((r) => typeof r.value === 'string')?.value ?? '',
    ).toLowerCase();
    const lines = text.split('\n').filter((l) => l.trim());
    let used = 0;
    for (const w of given) {
      if (text.includes(w.toLowerCase())) used += 1;
    }
    const self = responses.find((r) => typeof r.value === 'object' && r.value !== null);
    const rubric = (self?.value as Record<string, boolean>) || {};
    const rubricYes = ['all_words', 'sense', 'craft'].filter((k) => rubric[k]).length;

    const autoCorrect = used + (lines.length >= minLines ? 1 : 0);
    const autoTotal = given.length + 1;
    // Blend auto + self (self max 3)
    return buildScore(autoCorrect + rubricYes, autoTotal + 3, {
      wordsUsed: used,
      wordsTotal: given.length,
      lineCount: lines.length,
      rubricYes,
    });
  },
};
