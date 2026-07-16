/**
 * Task-switching pairs — alternate between two rule sets under time pressure.
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
  return [
    { level: 0, label: '12 trials · predictable', params: { trials: 12, switchEvery: 3 } },
    { level: 1, label: '16 · every 2', params: { trials: 16, switchEvery: 2 } },
    { level: 2, label: '20 · every 2', params: { trials: 20, switchEvery: 2 } },
    { level: 3, label: '24 · random switch', params: { trials: 24, switchEvery: 0 } },
    { level: 4, label: '30 · random fast', params: { trials: 30, switchEvery: 0, stimulusMs: 2500 } },
  ];
}

export const taskSwitchDrill: Drill = {
  meta: {
    id: 'task_switch',
    name: 'Task Switching',
    shortName: 'Switch',
    description: 'Odd/even vs higher/lower — switch rules when cued. Measures switch cost.',
    pillar: 'dharana',
    parallelSafe: true,
    icon: '🔀',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const trials = Number(difficulty.params.trials) || 16;
    const switchEvery = Number(difficulty.params.switchEvery) || 0;
    const stimulusMs = Number(difficulty.params.stimulusMs) || 3500;

    const prompts = [];
    const answers: string[] = [];
    let task: 'parity' | 'magnitude' = 'parity';

    for (let t = 0; t < trials; t++) {
      if (switchEvery > 0) {
        if (t > 0 && t % switchEvery === 0) task = task === 'parity' ? 'magnitude' : 'parity';
      } else if (t > 0 && rng() < 0.4) {
        task = task === 'parity' ? 'magnitude' : 'parity';
      }

      const n = rngInt(rng, 1, 9);
      let answer: string;
      let instruction: string;
      if (task === 'parity') {
        instruction = 'PARITY: is the number odd or even?';
        answer = n % 2 === 0 ? 'even' : 'odd';
      } else {
        instruction = 'MAGNITUDE: is the number lower or higher than 5?';
        answer = n < 5 ? 'lower' : n > 5 ? 'higher' : 'five';
      }
      answers.push(answer);

      prompts.push({
        id: createPromptId(),
        kind: 'task_switch_trial',
        instruction,
        payload: {
          phase: 'trial',
          task,
          number: n,
          options:
            task === 'parity'
              ? ['odd', 'even']
              : n === 5
                ? ['five']
                : ['lower', 'higher'],
        },
        timeLimitMs: stimulusMs,
      });
    }

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected: { answers, trials },
      meta: { trials },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const answers = (round.expected.answers as string[]) || [];
    let correct = 0;
    for (let i = 0; i < round.prompts.length; i++) {
      const p = round.prompts[i];
      const r = responses.find((x) => x.promptId === p.id);
      if (String(r?.value ?? '').toLowerCase() === answers[i]) correct += 1;
    }
    return buildScore(correct, answers.length);
  },
};
