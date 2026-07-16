/**
 * Vyasta recall — Jain-style memory feats.
 * Items tagged with random positions; recall forward, reverse, or by position.
 */

import {
  buildScore,
  createPromptId,
  createRoundId,
  createRng,
  rngInt,
  rngSample,
  type Difficulty,
  type Drill,
  type Response,
  type Round,
  type Score,
} from '../core';
import { getWordPack } from '../content';

function ladder(): Difficulty[] {
  const levels: Difficulty[] = [];
  const counts = [5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100];
  for (let i = 0; i < counts.length; i++) {
    levels.push({
      level: i,
      label: `${counts[i]} items`,
      params: {
        itemCount: counts[i],
        modes: i < 3 ? 'forward' : i < 6 ? 'forward,reverse' : 'forward,reverse,position',
        delayMs: Math.min(2000 + i * 500, 8000),
      },
    });
  }
  return levels;
}

function parseModes(modes: string): Array<'forward' | 'reverse' | 'position'> {
  return modes.split(',').map((m) => m.trim()) as Array<'forward' | 'reverse' | 'position'>;
}

export const vyastaRecallDrill: Drill = {
  meta: {
    id: 'vyasta_recall',
    name: 'Vyasta Recall',
    shortName: 'Vyasta',
    description:
      'Items tagged with positions. Recall the full sequence forward, reverse, or by queried position.',
    pillar: 'smriti',
    parallelSafe: true,
    icon: '📿',
    phase: 1,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const itemCount = Number(difficulty.params.itemCount) || 5;
    const modes = parseModes(String(difficulty.params.modes || 'forward'));
    const delayMs = Number(difficulty.params.delayMs) || 2000;
    const words = getWordPack().words;
    const items = rngSample(rng, words, itemCount);

    // Position tags (1-indexed), shuffled assignment feel
    const positions = items.map((_, i) => i + 1);
    const tagged = items.map((word, i) => ({
      position: positions[i],
      word,
    }));

    const prompts = [];

    // Encoding phase — show each tagged item
    for (const t of tagged) {
      prompts.push({
        id: createPromptId(),
        kind: 'encode',
        instruction: `Memorize: item #${t.position}`,
        payload: { position: t.position, word: t.word, phase: 'encode' },
        timeLimitMs: 2500,
      });
    }

    // Delay marker
    prompts.push({
      id: createPromptId(),
      kind: 'delay',
      instruction: 'Hold the sequence…',
      payload: { phase: 'delay', delayMs },
      timeLimitMs: delayMs,
    });

    const mode = modes[rngInt(rng, 0, modes.length - 1)];
    let expected: Record<string, unknown> = { mode, items };

    if (mode === 'forward') {
      const recallId = createPromptId();
      prompts.push({
        id: recallId,
        kind: 'recall_forward',
        instruction: 'Recall all items in order (comma-separated)',
        payload: { phase: 'recall', mode: 'forward', itemCount },
      });
      expected = { ...expected, answer: items.join(','), answers: items };
    } else if (mode === 'reverse') {
      const recallId = createPromptId();
      const reversed = [...items].reverse();
      prompts.push({
        id: recallId,
        kind: 'recall_reverse',
        instruction: 'Recall all items in reverse order (comma-separated)',
        payload: { phase: 'recall', mode: 'reverse', itemCount },
      });
      expected = { ...expected, answer: reversed.join(','), answers: reversed };
    } else {
      // Query 3 random positions
      const queryCount = Math.min(3, itemCount);
      const queryPositions: number[] = [];
      while (queryPositions.length < queryCount) {
        const p = rngInt(rng, 1, itemCount);
        if (!queryPositions.includes(p)) queryPositions.push(p);
      }
      const answers: string[] = [];
      for (const p of queryPositions) {
        const id = createPromptId();
        const word = items[p - 1];
        answers.push(word);
        prompts.push({
          id,
          kind: 'recall_position',
          instruction: `What was item #${p}?`,
          payload: { phase: 'recall', mode: 'position', position: p },
        });
      }
      expected = { ...expected, queryPositions, answers, answer: answers.join(',') };
    }

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts,
      expected,
      meta: { itemCount, mode },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const expectedAnswers = (round.expected.answers as string[]) || [];
    const mode = String(round.expected.mode || 'forward');
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');

    if (mode === 'position') {
      let correct = 0;
      const recallResponses = responses.filter((r) => {
        const p = round.prompts.find((pr) => pr.id === r.promptId);
        return p?.kind === 'recall_position';
      });
      for (let i = 0; i < expectedAnswers.length; i++) {
        const got = normalize(String(recallResponses[i]?.value ?? ''));
        if (got === normalize(expectedAnswers[i])) correct += 1;
      }
      return buildScore(correct, expectedAnswers.length, {
        mode,
        itemCount: expectedAnswers.length,
      });
    }

    // forward / reverse: parse comma-separated
    const recall = responses.find((r) => {
      const p = round.prompts.find((pr) => pr.id === r.promptId);
      return p?.kind?.startsWith('recall_');
    });
    const parts = String(recall?.value ?? '')
      .split(/[,;|/]+/)
      .map((s) => normalize(s))
      .filter(Boolean);

    let correct = 0;
    const total = expectedAnswers.length;
    for (let i = 0; i < total; i++) {
      if (parts[i] && parts[i] === normalize(expectedAnswers[i])) correct += 1;
    }

    return buildScore(correct, total, {
      mode,
      itemCount: total,
      partialCredit: correct / Math.max(total, 1),
    });
  },
};
