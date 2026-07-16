/**
 * Multi-language verse recall — lines fed out of order; reconstruct at end.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngPick,
  rngShuffle,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';
import { getVersePack } from '../content';

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '2 lines · order', params: { lineCount: 2, mode: 'order' } },
    { level: 1, label: '3 lines · order', params: { lineCount: 3, mode: 'order' } },
    { level: 2, label: '4 lines · order', params: { lineCount: 4, mode: 'order' } },
    { level: 3, label: '4 lines · type', params: { lineCount: 4, mode: 'type' } },
    { level: 4, label: 'Full verse · type', params: { lineCount: 4, mode: 'type', full: true } },
  ];
}

export const verseRecallDrill: Drill = {
  meta: {
    id: 'verse_recall',
    name: 'Verse Recall',
    shortName: 'Verse',
    description: 'Lines shown shuffled; restore correct order (and wording at higher levels).',
    pillar: 'smriti',
    parallelSafe: true,
    icon: '🕉️',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const pack = getVersePack();
    const verse = rngPick(rng, pack.items);
    const full = Boolean(difficulty.params.full);
    const lineCount = full
      ? verse.lines.length
      : Math.min(Number(difficulty.params.lineCount) || 4, verse.lines.length);
    const mode = String(difficulty.params.mode || 'order');
    const lines = verse.lines.slice(0, lineCount);
    const shuffled = rngShuffle(rng, lines.map((text, i) => ({ text, index: i })));

    const prompts = [
      {
        id: createPromptId(),
        kind: 'verse_show',
        instruction: `Memorize: ${verse.title}`,
        payload: {
          phase: 'encode',
          title: verse.title,
          language: verse.language,
          translation: verse.translation,
          lines,
          showMs: 8000 + lineCount * 1500,
        },
        timeLimitMs: 8000 + lineCount * 1500,
      },
      {
        id: createPromptId(),
        kind: mode === 'type' ? 'verse_type' : 'verse_order',
        instruction:
          mode === 'type'
            ? 'Type the lines in order (one per line)'
            : 'Order the shuffled lines correctly',
        payload: {
          phase: 'recall',
          mode,
          shuffled: shuffled.map((s) => s.text),
          lineCount,
        },
      },
    ];

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { lines, mode, verseId: verse.id },
      meta: { title: verse.title, lineCount },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const lines = (round.expected.lines as string[]) || [];
    const mode = String(round.expected.mode || 'order');
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

    const recall = responses.find((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind === 'verse_order' || p?.kind === 'verse_type';
    });

    if (mode === 'order') {
      // value: string[] in correct order chosen by user
      const ordered = (recall?.value as string[]) || [];
      let correct = 0;
      for (let i = 0; i < lines.length; i++) {
        if (normalize(ordered[i] ?? '') === normalize(lines[i])) correct += 1;
      }
      return buildScore(correct, lines.length, { mode });
    }

    const typed = String(recall?.value ?? '')
      .split('\n')
      .map(normalize)
      .filter(Boolean);
    let correct = 0;
    for (let i = 0; i < lines.length; i++) {
      if (typed[i] === normalize(lines[i])) correct += 1;
    }
    return buildScore(correct, lines.length, { mode });
  },
};
