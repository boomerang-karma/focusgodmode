/**
 * Warm temple / manuscript palette — saffron, earth, ink.
 */

export const colors = {
  bg: '#1a0f0a',
  bgElevated: '#2a1810',
  bgCard: '#332016',
  bgMuted: '#3d281c',

  border: '#5c3d2e',
  borderLight: '#7a5240',

  text: '#f5e6d3',
  textSecondary: '#c4a882',
  textMuted: '#8a7058',
  textInverse: '#1a0f0a',

  saffron: '#c45c26',
  saffronLight: '#e07a3d',
  gold: '#d4a017',
  goldDim: '#a67c00',

  success: '#4a9b6e',
  warning: '#d4a017',
  danger: '#c44b3c',
  info: '#5b8fad',

  pillar: {
    smriti: '#c45c26',
    sahitya: '#7b5ea7',
    dharana: '#5b8fad',
  },

  chart: ['#c45c26', '#d4a017', '#4a9b6e', '#5b8fad', '#7b5ea7'],
} as const;

export type ColorName = keyof typeof colors;
