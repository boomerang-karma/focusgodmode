/**
 * Dual n-back — modern working-memory / attention drill.
 * Visual position stream (+ optional letter stream at higher levels).
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

const LETTERS = 'BCDFGHKLMNPRSTV' as const;
const GRID = 9; // 3x3 positions 0-8

function ladder(): Difficulty[] {
  const levels: Difficulty[] = [];
  for (let n = 1; n <= 5; n++) {
    levels.push({
      level: n - 1,
      label: `N=${n} (${n === 1 ? 'visual' : 'dual'})`,
      params: {
        n,
        trials: 20 + n * 2,
        dual: n >= 2,
        stimulusMs: Math.max(1500, 2500 - n * 200),
      },
    });
  }
  return levels;
}

export const dualNBackDrill: Drill = {
  meta: {
    id: 'dual_n_back',
    name: 'Dual N-Back',
    shortName: 'N-Back',
    description:
      'Track positions (and letters) N steps back. The classic fluid-attention trainer.',
    pillar: 'dharana',
    parallelSafe: false, // high visual load — solo first; parallel in phase 2 carefully
    icon: '🧠',
    phase: 1,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const n = Number(difficulty.params.n) || 1;
    const trials = Number(difficulty.params.trials) || 20;
    const dual = Boolean(difficulty.params.dual);
    const stimulusMs = Number(difficulty.params.stimulusMs) || 2000;

    const positions: number[] = [];
    const letters: string[] = [];

    // Generate stream with ~30% match rate for each modality
    for (let t = 0; t < trials; t++) {
      if (t >= n && rng() < 0.3) {
        positions.push(positions[t - n]);
      } else {
        let p = rngInt(rng, 0, GRID - 1);
        if (t >= n) {
          while (p === positions[t - n]) p = rngInt(rng, 0, GRID - 1);
        }
        positions.push(p);
      }

      if (dual) {
        if (t >= n && rng() < 0.3) {
          letters.push(letters[t - n]);
        } else {
          let L = LETTERS[rngInt(rng, 0, LETTERS.length - 1)];
          if (t >= n) {
            while (L === letters[t - n]) L = LETTERS[rngInt(rng, 0, LETTERS.length - 1)];
          }
          letters.push(L);
        }
      } else {
        letters.push('');
      }
    }

    const posMatches: boolean[] = [];
    const letterMatches: boolean[] = [];
    for (let t = 0; t < trials; t++) {
      posMatches.push(t >= n && positions[t] === positions[t - n]);
      letterMatches.push(dual && t >= n && letters[t] === letters[t - n]);
    }

    const prompts = [];
    for (let t = 0; t < trials; t++) {
      prompts.push({
        id: createPromptId(),
        kind: 'nback_stimulus',
        instruction: t < n ? `Encoding… (${t + 1}/${n})` : `N=${n} — tap matches`,
        payload: {
          trial: t,
          position: positions[t],
          letter: letters[t],
          dual,
          n,
          phase: t < n ? 'encode' : 'respond',
          canRespond: t >= n,
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
      expected: { positions, letters, posMatches, letterMatches, n, dual, trials },
      meta: { n, dual, trials },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const posMatches = (round.expected.posMatches as boolean[]) || [];
    const letterMatches = (round.expected.letterMatches as boolean[]) || [];
    const dual = Boolean(round.expected.dual);
    const n = Number(round.expected.n) || 1;
    const trials = posMatches.length;

    // Response value: { positionMatch?: boolean, letterMatch?: boolean }
    let hits = 0;
    let misses = 0;
    let falseAlarms = 0;
    let correctRejections = 0;

    const respondable = Math.max(0, trials - n);

    for (let t = n; t < trials; t++) {
      const prompt = round.prompts[t];
      const resp = responses.find((r) => r.promptId === prompt.id);
      const val = (resp?.value as { positionMatch?: boolean; letterMatch?: boolean }) || {};

      // Position channel
      const posTrue = posMatches[t];
      const posSaid = Boolean(val.positionMatch);
      if (posTrue && posSaid) hits += 1;
      else if (posTrue && !posSaid) misses += 1;
      else if (!posTrue && posSaid) falseAlarms += 1;
      else correctRejections += 1;

      if (dual) {
        const letTrue = letterMatches[t];
        const letSaid = Boolean(val.letterMatch);
        if (letTrue && letSaid) hits += 1;
        else if (letTrue && !letSaid) misses += 1;
        else if (!letTrue && letSaid) falseAlarms += 1;
        else correctRejections += 1;
      }
    }

    const totalDecisions = respondable * (dual ? 2 : 1);
    const correct = hits + correctRejections;
    const accuracy = totalDecisions === 0 ? 0 : correct / totalDecisions;

    // d' approximation stored in details
    return buildScore(correct, totalDecisions, {
      n,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      accuracy,
    });
  },
};
