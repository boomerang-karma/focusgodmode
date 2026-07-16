/**
 * Stroop — color-word interference (say/tap the ink color, not the word).
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

const COLOR_NAMES = ['RED', 'GREEN', 'BLUE', 'YELLOW'] as const;
const COLOR_HEX: Record<(typeof COLOR_NAMES)[number], string> = {
  RED: '#c44b3c',
  GREEN: '#4a9b6e',
  BLUE: '#5b8fad',
  YELLOW: '#d4a017',
};

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '12 trials · slow', params: { trials: 12, congruentRatio: 0.5, stimulusMs: 2500 } },
    { level: 1, label: '16 trials', params: { trials: 16, congruentRatio: 0.4, stimulusMs: 2200 } },
    { level: 2, label: '20 trials', params: { trials: 20, congruentRatio: 0.35, stimulusMs: 2000 } },
    { level: 3, label: '24 · more conflict', params: { trials: 24, congruentRatio: 0.25, stimulusMs: 1800 } },
    { level: 4, label: '30 · fast', params: { trials: 30, congruentRatio: 0.2, stimulusMs: 1500 } },
  ];
}

export const stroopDrill: Drill = {
  meta: {
    id: 'stroop',
    name: 'Stroop',
    shortName: 'Stroop',
    description: 'Tap the ink color, not the written word. Classic interference control.',
    pillar: 'dharana',
    parallelSafe: false,
    icon: '🎨',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const trials = Number(difficulty.params.trials) || 16;
    const congruentRatio = Number(difficulty.params.congruentRatio) || 0.4;
    const stimulusMs = Number(difficulty.params.stimulusMs) || 2000;

    const prompts = [];
    const inks: string[] = [];

    for (let t = 0; t < trials; t++) {
      const word = rngPick(rng, COLOR_NAMES as unknown as string[]);
      const congruent = rng() < congruentRatio;
      let ink = word;
      if (!congruent) {
        do {
          ink = COLOR_NAMES[rngInt(rng, 0, COLOR_NAMES.length - 1)];
        } while (ink === word);
      }
      inks.push(ink);
      prompts.push({
        id: createPromptId(),
        kind: 'stroop_trial',
        instruction: 'Tap the INK color (not the word)',
        payload: {
          phase: 'trial',
          word,
          ink,
          inkHex: COLOR_HEX[ink as keyof typeof COLOR_HEX],
          options: [...COLOR_NAMES],
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
      expected: { inks, trials },
      meta: { trials },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const inks = (round.expected.inks as string[]) || [];
    let correct = 0;
    for (let i = 0; i < round.prompts.length; i++) {
      const p = round.prompts[i];
      const r = responses.find((x) => x.promptId === p.id);
      if (String(r?.value ?? '').toUpperCase() === inks[i]) correct += 1;
    }
    return buildScore(correct, inks.length, { stroopCorrect: correct });
  },
};
