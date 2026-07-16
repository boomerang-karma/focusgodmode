/**
 * Festival night palette — deep indigo sky, molten saffron, electric gold, rose glow.
 * "Lit" temple energy, not flat brown.
 */

export const colors = {
  // Night sky base
  bg: '#0b0618',
  bgElevated: '#140a28',
  bgCard: '#1a1035',
  bgMuted: '#241544',
  bgGlow: '#2d1858',

  // Neon-warm edges
  border: '#4a2d7a',
  borderLight: '#7c4dff',
  borderGlow: '#ff9f43',

  // Bright ink on night
  text: '#fff8f0',
  textSecondary: '#e8d4ff',
  textMuted: '#a894c4',
  textInverse: '#0b0618',

  // Fire & metal
  saffron: '#ff6b1a',
  saffronLight: '#ff9a3c',
  saffronHot: '#ff3d00',
  gold: '#ffd54a',
  goldDim: '#f0b429',
  goldBright: '#ffe082',

  // Accents
  magenta: '#ff2d95',
  magentaSoft: '#ff6bb5',
  violet: '#9b5cff',
  violetSoft: '#c4a0ff',
  cyan: '#2de2e6',
  lime: '#b8f55a',

  success: '#3dd68c',
  warning: '#ffd54a',
  danger: '#ff4d6d',
  info: '#5ac8ff',

  pillar: {
    smriti: '#ff6b1a',
    sahitya: '#c77dff',
    dharana: '#2de2e6',
  },

  chart: ['#ff6b1a', '#ffd54a', '#3dd68c', '#2de2e6', '#c77dff', '#ff2d95'],

  // Gradient tuples for LinearGradient
  gradients: {
    night: ['#0b0618', '#1a0a3e', '#2a1050'] as const,
    saffron: ['#ff3d00', '#ff6b1a', '#ffb347'] as const,
    gold: ['#f0b429', '#ffd54a', '#fff59d'] as const,
    violet: ['#5b21b6', '#7c3aed', '#c084fc'] as const,
    aurora: ['#ff6b1a', '#ff2d95', '#9b5cff'] as const,
    card: ['#1f1245', '#2a1858'] as const,
    success: ['#059669', '#34d399'] as const,
  },
} as const;

export type ColorName = keyof typeof colors;
