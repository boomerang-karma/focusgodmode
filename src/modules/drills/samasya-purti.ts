/**
 * Samasya-purti (lite) — compose a short verse/quatrain ending with a given line.
 * MVP: self-scoring rubric (AI judging is phase 4).
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
import { getSamasyaPack } from '../content';

function ladder(): Difficulty[] {
  return [
    {
      level: 0,
      label: 'Easy — free lines + rhyme optional',
      params: { minLines: 2, requireRhyme: false, timeLimitMs: 180000, showHint: true },
    },
    {
      level: 1,
      label: 'Standard — 3 lines + given last',
      params: { minLines: 3, requireRhyme: false, timeLimitMs: 150000, showHint: true },
    },
    {
      level: 2,
      label: 'Rhyme — rough end-rhyme',
      params: { minLines: 3, requireRhyme: true, timeLimitMs: 150000, showHint: true },
    },
    {
      level: 3,
      label: 'Timed — 2 minutes',
      params: { minLines: 3, requireRhyme: true, timeLimitMs: 120000, showHint: false },
    },
    {
      level: 4,
      label: 'Strict — 90s, no hint',
      params: { minLines: 4, requireRhyme: true, timeLimitMs: 90000, showHint: false },
    },
  ];
}

export const samasyaPurtiDrill: Drill = {
  meta: {
    id: 'samasya_purti',
    name: 'Samasya-purti',
    shortName: 'Samasya',
    description:
      'Complete a verse so an absurd last line becomes sensible. Self-score in MVP; AI later.',
    pillar: 'sahitya',
    parallelSafe: true,
    icon: '✍️',
    phase: 1,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const pack = getSamasyaPack();
    const item = rngPick(rng, pack.items);
    const minLines = Number(difficulty.params.minLines) || 3;
    const requireRhyme = Boolean(difficulty.params.requireRhyme);
    const timeLimitMs = Number(difficulty.params.timeLimitMs) || 180000;
    const showHint = Boolean(difficulty.params.showHint);

    const prompts = [
      {
        id: createPromptId(),
        kind: 'samasya_compose',
        instruction: `Compose ${minLines} line(s) that lead into the given last line. Make it sensible.`,
        payload: {
          lastLine: item.lastLine,
          hint: showHint ? item.hint : null,
          minLines,
          requireRhyme,
          phase: 'compose',
        },
        timeLimitMs,
      },
      {
        id: createPromptId(),
        kind: 'samasya_self_score',
        instruction: 'Self-score your composition (MVP rubric)',
        payload: {
          phase: 'self_score',
          criteria: [
            { id: 'coherence', label: 'Does the last line feel natural?' },
            { id: 'creativity', label: 'Is the setup witty or original?' },
            { id: 'craft', label: 'Reasonable line length / rhythm?' },
            { id: 'rhyme', label: 'Rhyme achieved (if required)?' },
          ],
        },
      },
    ];

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: {
        lastLine: item.lastLine,
        minLines,
        requireRhyme,
        // No auto ground truth — self-score
      },
      meta: { lastLine: item.lastLine },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const compose = responses.find((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind === 'samasya_compose';
    });
    const selfScore = responses.find((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind === 'samasya_self_score';
    });

    const text = String(compose?.value ?? '').trim();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const minLines = Number(round.expected.minLines) || 3;
    const hasContent = lines.length >= minLines && text.length >= 20;

    const rubric = (selfScore?.value as Record<string, boolean>) || {};
    const criteria = ['coherence', 'creativity', 'craft', 'rhyme'] as const;
    let yes = 0;
    for (const c of criteria) {
      if (rubric[c]) yes += 1;
    }

    // Require content + self-score
    const correct = hasContent ? yes : 0;
    const total = criteria.length;

    return buildScore(correct, total, {
      lineCount: lines.length,
      charCount: text.length,
      hasContent,
      selfScoreYes: yes,
      compositionPreview: text.slice(0, 120),
    });
  },
};
