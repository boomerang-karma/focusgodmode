/**
 * Arithmetic-under-load — mental math while a memory stream runs.
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

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '3 words · easy math', params: { words: 3, ops: 3, maxN: 12 } },
    { level: 1, label: '4 words · mixed', params: { words: 4, ops: 4, maxN: 20 } },
    { level: 2, label: '5 words · harder', params: { words: 5, ops: 5, maxN: 30 } },
    { level: 3, label: '6 words · multiply', params: { words: 6, ops: 6, maxN: 12, allowMul: true } },
    { level: 4, label: '8 words · dense', params: { words: 8, ops: 8, maxN: 15, allowMul: true } },
  ];
}

export const arithmeticLoadDrill: Drill = {
  meta: {
    id: 'arithmetic_load',
    name: 'Arithmetic under Load',
    shortName: 'Arith+',
    description: 'Hold words in memory while solving mental math — dual-stream under load.',
    pillar: 'dharana',
    parallelSafe: true,
    icon: '🧮',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const wordCount = Number(difficulty.params.words) || 3;
    const ops = Number(difficulty.params.ops) || 3;
    const maxN = Number(difficulty.params.maxN) || 12;
    const allowMul = Boolean(difficulty.params.allowMul);

    const words: string[] = [];
    const pack = getWordPack().words;
    while (words.length < wordCount) {
      const w = rngPick(rng, pack);
      if (!words.includes(w)) words.push(w);
    }

    const prompts = [];
    for (let i = 0; i < words.length; i++) {
      prompts.push({
        id: createPromptId(),
        kind: 'encode',
        instruction: `Hold word ${i + 1}/${wordCount}`,
        payload: { phase: 'encode', word: words[i], position: i + 1 },
        timeLimitMs: 1800,
      });
    }

    const mathAnswers: number[] = [];
    for (let i = 0; i < ops; i++) {
      const a = rngInt(rng, 2, maxN);
      const b = rngInt(rng, 2, maxN);
      const opRoll = rng();
      let expr: string;
      let ans: number;
      if (allowMul && opRoll > 0.66) {
        expr = `${a} × ${b}`;
        ans = a * b;
      } else if (opRoll > 0.33) {
        expr = `${a + b} − ${b}`;
        ans = a;
      } else {
        expr = `${a} + ${b}`;
        ans = a + b;
      }
      mathAnswers.push(ans);
      prompts.push({
        id: createPromptId(),
        kind: 'math_q',
        instruction: `Solve (keep the words!): ${expr}`,
        payload: { phase: 'math', expr },
        timeLimitMs: 15000,
      });
    }

    prompts.push({
      id: createPromptId(),
      kind: 'recall_forward',
      instruction: 'Recall the words in order (comma-separated)',
      payload: { phase: 'recall', itemCount: wordCount },
    });

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { words, mathAnswers },
      meta: { wordCount, ops },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const words = (round.expected.words as string[]) || [];
    const mathAnswers = (round.expected.mathAnswers as number[]) || [];
    const normalize = (s: string) => s.toLowerCase().trim();

    let mathCorrect = 0;
    let mi = 0;
    for (const p of round.prompts) {
      if (p.kind !== 'math_q') continue;
      const r = responses.find((x) => x.promptId === p.id);
      const got = parseInt(String(r?.value ?? '').replace(/\D/g, ''), 10);
      if (got === mathAnswers[mi]) mathCorrect += 1;
      mi += 1;
    }

    const recallP = round.prompts.find((p) => p.kind === 'recall_forward');
    const recall = responses.find((r) => r.promptId === recallP?.id);
    const parts = String(recall?.value ?? '')
      .split(/[,;|/]+/)
      .map(normalize)
      .filter(Boolean);
    let wordCorrect = 0;
    for (let i = 0; i < words.length; i++) {
      if (parts[i] === normalize(words[i])) wordCorrect += 1;
    }

    return buildScore(wordCorrect + mathCorrect, words.length + mathAnswers.length, {
      wordCorrect,
      mathCorrect,
    });
  },
};
