/**
 * Aprastuta-prasanga — witty interruptions mid-task; answer and resume.
 * Trains recovery of place after distraction (core avadhana skill).
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngInt,
  rngPick,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';
import { getWordPack } from '../content';

const HECKLES = [
  { q: 'What is 17 × 3?', a: '51' },
  { q: 'Name a color of the sky at noon.', a: 'blue' },
  { q: 'How many days in a leap year?', a: '366' },
  { q: 'What is the opposite of silence?', a: 'noise' },
  { q: 'Spell “avadhana” backwards (letters).', a: 'anahadava' },
  { q: 'What is 100 − 37?', a: '63' },
  { q: 'Capital of France?', a: 'paris' },
  { q: 'How many strings on a classical guitar?', a: '6' },
];

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '5 items · 1 heckle', params: { items: 5, heckles: 1 } },
    { level: 1, label: '6 items · 2 heckles', params: { items: 6, heckles: 2 } },
    { level: 2, label: '8 items · 2 heckles', params: { items: 8, heckles: 2 } },
    { level: 3, label: '8 items · 3 heckles', params: { items: 8, heckles: 3 } },
    { level: 4, label: '10 items · 4 heckles', params: { items: 10, heckles: 4 } },
  ];
}

export const aprastutaPrasangaDrill: Drill = {
  meta: {
    id: 'aprastuta_prasanga',
    name: 'Aprastuta-prasanga',
    shortName: 'Heckler',
    description:
      'Memorize a list while witty interruptions demand answers — then resume without losing place.',
    pillar: 'sahitya',
    parallelSafe: false,
    icon: '🎭',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const itemCount = Number(difficulty.params.items) || 5;
    const heckleCount = Number(difficulty.params.heckles) || 1;
    const words = getWordPack().words;
    const items: string[] = [];
    while (items.length < itemCount) {
      const w = rngPick(rng, words);
      if (!items.includes(w)) items.push(w);
    }

    // Insert heckles at random positions after first encode
    const heckleSlots = new Set<number>();
    while (heckleSlots.size < heckleCount && heckleSlots.size < itemCount - 1) {
      heckleSlots.add(rngInt(rng, 1, itemCount - 1));
    }

    const prompts = [];
    const heckleAnswers: string[] = [];

    for (let i = 0; i < items.length; i++) {
      if (heckleSlots.has(i)) {
        const h = rngPick(rng, HECKLES);
        heckleAnswers.push(h.a.toLowerCase());
        prompts.push({
          id: createPromptId(),
          kind: 'heckle',
          instruction: 'Interruption! Answer, then continue.',
          payload: { phase: 'heckle', question: h.q, expected: h.a },
          timeLimitMs: 20000,
        });
      }
      prompts.push({
        id: createPromptId(),
        kind: 'encode',
        instruction: `Memorize item ${i + 1}/${itemCount}`,
        payload: { phase: 'encode', word: items[i], position: i + 1 },
        timeLimitMs: 2000,
      });
    }

    prompts.push({
      id: createPromptId(),
      kind: 'recall_forward',
      instruction: 'Recall the full list in order (comma-separated)',
      payload: { phase: 'recall', itemCount },
    });

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { items, heckleAnswers, answer: items.join(',') },
      meta: { itemCount, heckleCount },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const items = (round.expected.items as string[]) || [];
    const heckleAnswers = (round.expected.heckleAnswers as string[]) || [];
    const normalize = (s: string) => s.toLowerCase().trim();

    let heckleCorrect = 0;
    const prompts = round.prompts;
    let hi = 0;
    for (const p of prompts) {
      if (p.kind !== 'heckle') continue;
      const resp = responses.find((r) => r.promptId === p.id);
      const got = normalize(String(resp?.value ?? ''));
      const exp = normalize(heckleAnswers[hi] ?? String(p.payload.expected ?? ''));
      if (got === exp || got.includes(exp) || exp.includes(got)) heckleCorrect += 1;
      hi += 1;
    }

    const recallPrompt = prompts.find((p) => p.kind === 'recall_forward');
    const recall = responses.find((r) => r.promptId === recallPrompt?.id);
    const parts = String(recall?.value ?? '')
      .split(/[,;|/]+/)
      .map((s) => normalize(s))
      .filter(Boolean);

    let itemCorrect = 0;
    for (let i = 0; i < items.length; i++) {
      if (parts[i] === normalize(items[i])) itemCorrect += 1;
    }

    const total = items.length + heckleAnswers.length;
    const correct = itemCorrect + heckleCorrect;
    return buildScore(correct, total, {
      itemCorrect,
      itemTotal: items.length,
      heckleCorrect,
      heckleTotal: heckleAnswers.length,
    });
  },
};
