/**
 * Digit / word span — forward and backward span with adaptive length.
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
  const levels: Difficulty[] = [];
  for (let len = 3; len <= 12; len++) {
    levels.push({
      level: len - 3,
      label: `Span ${len}`,
      params: {
        spanLength: len,
        direction: len <= 6 ? 'forward' : len <= 9 ? 'mixed' : 'backward',
        trials: 3,
      },
    });
  }
  return levels;
}

function generateSequence(rng: () => number, length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    // Avoid consecutive duplicates for clarity
    let d = rngInt(rng, 0, 9);
    while (i > 0 && d === seq[i - 1]) d = rngInt(rng, 0, 9);
    seq.push(d);
  }
  return seq;
}

export const digitSpanDrill: Drill = {
  meta: {
    id: 'digit_span',
    name: 'Digit Span',
    shortName: 'Span',
    description: 'Classic forward and backward digit span — adaptive working memory measure.',
    pillar: 'smriti',
    parallelSafe: true,
    icon: '🔢',
    phase: 1,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const spanLength = Number(difficulty.params.spanLength) || 4;
    const directionParam = String(difficulty.params.direction || 'forward');
    const trials = Number(difficulty.params.trials) || 3;

    const prompts = [];
    const sequences: number[][] = [];
    const directions: Array<'forward' | 'backward'> = [];
    const answers: string[] = [];

    for (let t = 0; t < trials; t++) {
      const seq = generateSequence(rng, spanLength);
      sequences.push(seq);

      let dir: 'forward' | 'backward' = 'forward';
      if (directionParam === 'backward') dir = 'backward';
      else if (directionParam === 'mixed') dir = rng() < 0.5 ? 'forward' : 'backward';
      directions.push(dir);

      // Encode digits one by one
      for (let i = 0; i < seq.length; i++) {
        prompts.push({
          id: createPromptId(),
          kind: 'digit_show',
          instruction: `Digit ${i + 1} of ${seq.length}`,
          payload: { digit: seq[i], index: i, trial: t, phase: 'encode' },
          timeLimitMs: 1000,
        });
      }

      const expected =
        dir === 'forward' ? seq.join('') : [...seq].reverse().join('');
      answers.push(expected);

      prompts.push({
        id: createPromptId(),
        kind: 'digit_recall',
        instruction:
          dir === 'forward'
            ? 'Enter the digits in the same order'
            : 'Enter the digits in reverse order',
        payload: {
          phase: 'recall',
          trial: t,
          direction: dir,
          spanLength,
        },
      });
    }

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { sequences, directions, answers, spanLength },
      meta: { spanLength, trials },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const answers = (round.expected.answers as string[]) || [];
    const recalls = responses.filter((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind === 'digit_recall';
    });

    let correct = 0;
    for (let i = 0; i < answers.length; i++) {
      const got = String(recalls[i]?.value ?? '')
        .replace(/\D/g, '');
      if (got === answers[i]) correct += 1;
    }

    const spanLength = Number(round.expected.spanLength) || 0;
    return buildScore(
      correct,
      answers.length,
      { spanLength, trialsCorrect: correct },
      { up: 0.67, down: 0.34 }, // 2/3 trials to go up
    );
  },
};
