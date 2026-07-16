/**
 * Ashu-kavitva — timed extempore composition on a surprise topic.
 * Phase 2: text + optional voice note metadata (recording UI hooks in).
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

const TOPICS = [
  'A broken clock that still tells the truth',
  'Meeting your childhood self at a crossroads',
  'The last mango of summer',
  'A city that sleeps only once a year',
  'Why silence is louder than drums',
  'A letter never sent',
  'The crow that taught a peacock humility',
  'Rain that falls only on one house',
  'A guru who answers only with questions',
  'The weight of an unused name',
];

function ladder(): Difficulty[] {
  return [
    { level: 0, label: '3 min free verse', params: { timeLimitMs: 180000, minWords: 30 } },
    { level: 1, label: '2.5 min', params: { timeLimitMs: 150000, minWords: 40 } },
    { level: 2, label: '2 min', params: { timeLimitMs: 120000, minWords: 50 } },
    { level: 3, label: '90s pressure', params: { timeLimitMs: 90000, minWords: 40 } },
    { level: 4, label: '60s flash', params: { timeLimitMs: 60000, minWords: 30 } },
  ];
}

export const ashuKavitvaDrill: Drill = {
  meta: {
    id: 'ashu_kavitva',
    name: 'Ashu-kavitva',
    shortName: 'Ashu',
    description: 'Timed extempore composition on a surprise topic. Text now; voice recording ready.',
    pillar: 'sahitya',
    parallelSafe: false,
    icon: '🎤',
    phase: 2,
    enabled: true,
  },

  difficultyLadder: ladder(),

  generateRound(difficulty: Difficulty, seed: string): Round {
    const rng = createRng(seed);
    const topic = rngPick(rng, TOPICS);
    const timeLimitMs = Number(difficulty.params.timeLimitMs) || 120000;
    const minWords = Number(difficulty.params.minWords) || 40;

    return {
      id: createRoundId(),
      drillId: this.meta.id,
      difficulty,
      seed,
      prompts: [
        {
          id: createPromptId(),
          kind: 'ashu_compose',
          instruction: `Compose now on the surprise topic (timer runs)`,
          payload: {
            phase: 'compose',
            topic,
            minWords,
            allowVoice: true,
          },
          timeLimitMs,
        },
        {
          id: createPromptId(),
          kind: 'sahitya_self_score',
          instruction: 'Self-score',
          payload: {
            phase: 'self_score',
            criteria: [
              { id: 'on_topic', label: 'Clearly addresses the topic' },
              { id: 'complete', label: 'Feels complete, not abandoned mid-thought' },
              { id: 'spark', label: 'At least one surprising image or turn' },
            ],
          },
        },
      ],
      expected: { topic, minWords },
      meta: { topic },
    };
  },

  score(round: Round, responses: Response[]): Score {
    const minWords = Number(round.expected.minWords) || 40;
    const compose = responses.find((r) => typeof r.value === 'string' || (r.value && typeof r.value === 'object' && 'text' in (r.value as object)));
    let text = '';
    if (typeof compose?.value === 'string') text = compose.value;
    else if (compose?.value && typeof compose.value === 'object') {
      text = String((compose.value as { text?: string }).text ?? '');
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const self = responses.find((r) => typeof r.value === 'object' && r.value && !('text' in (r.value as object)));
    const rubric = (self?.value as Record<string, boolean>) || {};
    const yes = ['on_topic', 'complete', 'spark'].filter((k) => rubric[k]).length;
    const auto = words >= minWords ? 1 : 0;
    return buildScore(auto + yes, 1 + 3, { words, minWords, rubricYes: yes });
  },
};
