/**
 * Age-wise practice profiles.
 *
 * A 7-year-old and a 40-year-old train the same art, but with different
 * drill sets, session length, max streams, and difficulty caps.
 * Pure config — UI and session start only filter against this module.
 */

import type { AgeBandId } from '../core/types';

export type { AgeBandId };

/** Full catalog of drill plugin ids */
export const ALL_DRILL_IDS = [
  'vyasta_recall',
  'digit_span',
  'ghanta_ganana',
  'dual_n_back',
  'samasya_purti',
  'verse_recall',
  'nishedhakshari',
  'datta_padi',
  'ashu_kavitva',
  'aprastuta_prasanga',
  'puranapathana',
  'schulte',
  'stroop',
  'task_switch',
  'arithmetic_load',
] as const;

export interface AgeBand {
  id: AgeBandId;
  label: string;
  ageRange: string;
  exampleAge: number;
  title: string;
  description: string;
  focus: string;
  icon: string;
  sessionMinutes: number;
  maxStreams: number;
  maxDifficultyLevel: number;
  enableBell: boolean;
  enableHeckler: boolean;
  kidFriendly: boolean;
  drillIds: string[];
  starterDrillIds: string[];
  sessionPresets: {
    id: string;
    label: string;
    drillIds: string[];
    heckler: boolean;
  }[];
}

export const AGE_BANDS: AgeBand[] = [
  {
    id: 'child',
    label: 'Child',
    ageRange: 'Ages 5–8',
    exampleAge: 7,
    title: 'Little Avadhani',
    description:
      'Playful memory games and short attention drills. Short sessions, no heckling, gentle pace — perfect around age 7.',
    focus: 'Fun memory · short focus · confidence',
    icon: '🌱',
    sessionMinutes: 8,
    maxStreams: 1,
    maxDifficultyLevel: 1,
    enableBell: false,
    enableHeckler: false,
    kidFriendly: true,
    drillIds: [
      'digit_span',
      'vyasta_recall',
      'ghanta_ganana',
      'schulte',
      'verse_recall',
    ],
    starterDrillIds: ['digit_span', 'vyasta_recall', 'schulte'],
    sessionPresets: [
      {
        id: 'child_solo',
        label: 'One gentle game',
        drillIds: ['digit_span'],
        heckler: false,
      },
    ],
  },
  {
    id: 'preteen',
    label: 'Preteen',
    ageRange: 'Ages 9–12',
    exampleAge: 10,
    title: 'Growing focus',
    description:
      'Build working memory and light dual-task skill. Two-stream practice unlocked; keep sessions short.',
    focus: 'Working memory · light multi-task',
    icon: '🌿',
    sessionMinutes: 12,
    maxStreams: 2,
    maxDifficultyLevel: 3,
    enableBell: true,
    enableHeckler: false,
    kidFriendly: true,
    drillIds: [
      'digit_span',
      'vyasta_recall',
      'ghanta_ganana',
      'schulte',
      'verse_recall',
      'dual_n_back',
      'task_switch',
      'puranapathana',
    ],
    starterDrillIds: ['digit_span', 'vyasta_recall', 'ghanta_ganana'],
    sessionPresets: [
      {
        id: 'preteen_dvi',
        label: '2-stream beginner',
        drillIds: ['vyasta_recall', 'digit_span'],
        heckler: false,
      },
    ],
  },
  {
    id: 'teen',
    label: 'Teen',
    ageRange: 'Ages 13–17',
    exampleAge: 15,
    title: 'Student track',
    description:
      'Full cognitive set plus literary starts. Exam-friendly attention and composition under light load.',
    focus: 'Study focus · composition · 2–3 streams',
    icon: '📚',
    sessionMinutes: 15,
    maxStreams: 3,
    maxDifficultyLevel: 5,
    enableBell: true,
    enableHeckler: false,
    kidFriendly: false,
    drillIds: [
      'digit_span',
      'vyasta_recall',
      'ghanta_ganana',
      'dual_n_back',
      'schulte',
      'stroop',
      'task_switch',
      'arithmetic_load',
      'verse_recall',
      'samasya_purti',
      'datta_padi',
      'puranapathana',
      'nishedhakshari',
    ],
    starterDrillIds: ['dual_n_back', 'arithmetic_load', 'samasya_purti'],
    sessionPresets: [
      {
        id: 'teen_dvi',
        label: 'Dvi-avadhani (2)',
        drillIds: ['vyasta_recall', 'digit_span'],
        heckler: false,
      },
      {
        id: 'teen_tri',
        label: '3-stream study set',
        drillIds: ['vyasta_recall', 'task_switch', 'arithmetic_load'],
        heckler: false,
      },
    ],
  },
  {
    id: 'young_adult',
    label: 'Young adult',
    ageRange: 'Ages 18–30',
    exampleAge: 25,
    title: 'Peak training',
    description:
      'Full catalog and multi-stream sessions. Build toward Chatur- and Ashtavadhani tracks.',
    focus: 'Full pillars · interference · speed',
    icon: '🔥',
    sessionMinutes: 20,
    maxStreams: 6,
    maxDifficultyLevel: 99,
    enableBell: true,
    enableHeckler: true,
    kidFriendly: false,
    drillIds: [...ALL_DRILL_IDS],
    starterDrillIds: ['dual_n_back', 'samasya_purti', 'aprastuta_prasanga'],
    sessionPresets: [
      {
        id: 'ya_dvi',
        label: 'Dvi-avadhani (2)',
        drillIds: ['vyasta_recall', 'digit_span'],
        heckler: false,
      },
      {
        id: 'ya_chatur',
        label: 'Chatur-avadhani (4)',
        drillIds: ['vyasta_recall', 'digit_span', 'task_switch', 'arithmetic_load'],
        heckler: true,
      },
      {
        id: 'ya_ashta',
        label: 'Ashta track (6)',
        drillIds: [
          'vyasta_recall',
          'digit_span',
          'verse_recall',
          'task_switch',
          'arithmetic_load',
          'puranapathana',
        ],
        heckler: true,
      },
    ],
  },
  {
    id: 'adult',
    label: 'Adult',
    ageRange: 'Ages 31–50',
    exampleAge: 40,
    title: 'Householder track',
    description:
      'Around age 40: sustainable depth over heroics. Full drills, 2–4 streams, balanced sadhana — memory, wit, and calm under load.',
    focus: 'Sustainable multi-stream · clarity · streak',
    icon: '🪔',
    sessionMinutes: 15,
    maxStreams: 4,
    maxDifficultyLevel: 99,
    enableBell: true,
    enableHeckler: true,
    kidFriendly: false,
    drillIds: [...ALL_DRILL_IDS],
    starterDrillIds: ['digit_span', 'samasya_purti', 'stroop', 'ghanta_ganana'],
    sessionPresets: [
      {
        id: 'adult_dvi',
        label: 'Dvi — daily core (2)',
        drillIds: ['vyasta_recall', 'digit_span'],
        heckler: false,
      },
      {
        id: 'adult_chatur',
        label: 'Chatur weekend (4)',
        drillIds: ['vyasta_recall', 'digit_span', 'task_switch', 'samasya_purti'],
        heckler: true,
      },
      {
        id: 'adult_focus',
        label: 'Attention repair set',
        drillIds: ['stroop', 'schulte', 'ghanta_ganana'],
        heckler: false,
      },
    ],
  },
  {
    id: 'senior',
    label: 'Senior',
    ageRange: 'Ages 50+',
    exampleAge: 60,
    title: 'Steady flame',
    description:
      'Cognitive longevity: memory, verse, gentle dual-task. Lower pressure, high consistency. Bells optional; no aggressive heckling.',
    focus: 'Memory longevity · verse · calm focus',
    icon: '🌕',
    sessionMinutes: 12,
    maxStreams: 2,
    maxDifficultyLevel: 4,
    enableBell: true,
    enableHeckler: false,
    kidFriendly: false,
    drillIds: [
      'digit_span',
      'vyasta_recall',
      'verse_recall',
      'ghanta_ganana',
      'schulte',
      'stroop',
      'task_switch',
      'samasya_purti',
      'puranapathana',
      'datta_padi',
    ],
    starterDrillIds: ['digit_span', 'verse_recall', 'schulte'],
    sessionPresets: [
      {
        id: 'senior_dvi',
        label: 'Gentle 2-stream',
        drillIds: ['vyasta_recall', 'digit_span'],
        heckler: false,
      },
      {
        id: 'senior_memory',
        label: 'Memory & verse',
        drillIds: ['verse_recall', 'digit_span'],
        heckler: false,
      },
    ],
  },
];

export function getAgeBands(): AgeBand[] {
  return AGE_BANDS;
}

export function getAgeBand(id: AgeBandId | string | undefined | null): AgeBand {
  return AGE_BANDS.find((b) => b.id === id) ?? AGE_BANDS.find((b) => b.id === 'adult')!;
}

export function getAgeBandByExampleAge(age: number): AgeBand {
  if (age <= 8) return getAgeBand('child');
  if (age <= 12) return getAgeBand('preteen');
  if (age <= 17) return getAgeBand('teen');
  if (age <= 30) return getAgeBand('young_adult');
  if (age <= 50) return getAgeBand('adult');
  return getAgeBand('senior');
}

export function isDrillAllowedForAge(drillId: string, bandId: AgeBandId | string): boolean {
  return getAgeBand(bandId).drillIds.includes(drillId);
}

export function capDifficultyLevel(level: number, bandId: AgeBandId | string): number {
  return Math.min(level, getAgeBand(bandId).maxDifficultyLevel);
}

export function listDrillsForAge(bandId: AgeBandId | string): string[] {
  return [...getAgeBand(bandId).drillIds];
}

export function ageBandCopy(band: AgeBand): {
  practiceTitle: string;
  sessionHint: string;
  emptyCatalog: string;
} {
  if (band.kidFriendly) {
    return {
      practiceTitle: `${band.icon} Games for ${band.ageRange.toLowerCase()}`,
      sessionHint: `About ${band.sessionMinutes} minutes · keep it fun`,
      emptyCatalog: 'Ask a parent to pick another age path if these feel too easy or hard.',
    };
  }
  return {
    practiceTitle: `${band.icon} ${band.title}`,
    sessionHint: `~${band.sessionMinutes} min · up to ${band.maxStreams} stream${band.maxStreams > 1 ? 's' : ''}`,
    emptyCatalog: 'No drills in this filter for your age path.',
  };
}
