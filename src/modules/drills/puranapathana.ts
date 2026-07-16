/**
 * Puranapathana quiz — literary/scripture/avadhana knowledge bank.
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
import { getQuizPack } from '../content';

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '5 questions', params: { count: 5 } },
    { level: 1, label: '6 questions', params: { count: 6 } },
    { level: 2, label: '8 questions', params: { count: 8 } },
    { level: 3, label: '10 questions', params: { count: 10 } },
    { level: 4, label: '12 questions', params: { count: 12 } },
  ];
}

export const puranapathanaDrill: Drill = {
  meta: {
    id: 'puranapathana',
    name: 'Puranapathana Quiz',
    shortName: 'Quiz',
    description: 'Literary, itihasa, and avadhana knowledge. User-extensible quiz packs.',
    pillar: 'sahitya',
    parallelSafe: true,
    icon: '📚',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const count = Number(difficulty.params.count) || 5;
    const pack = getQuizPack();
    const picked = rngShuffle(rng, pack.items).slice(0, Math.min(count, pack.items.length));

    const prompts = picked.map((item) => ({
      id: createPromptId(),
      kind: 'quiz_mcq',
      instruction: item.question,
      payload: {
        phase: 'quiz',
        options: item.options,
        topic: item.topic,
        itemId: item.id,
      },
    }));

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: {
        answers: picked.map((p) => p.answer),
        itemIds: picked.map((p) => p.id),
      },
      meta: { count: picked.length },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const answers = (round.expected.answers as number[]) || [];
    let correct = 0;
    for (let i = 0; i < round.prompts.length; i++) {
      const p = round.prompts[i];
      const r = responses.find((x) => x.promptId === p.id);
      const got = Number(r?.value);
      if (got === answers[i]) correct += 1;
    }
    return buildScore(correct, answers.length, { quizCorrect: correct });
  },
};
