export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const typography = {
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: '800' as const, letterSpacing: 0.2 },
  subtitle: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  mono: { fontSize: 28, fontWeight: '800' as const, fontVariant: ['tabular-nums' as const] },
};

export const shadow = {
  glow: {
    shadowColor: '#ff6b1a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#9b5cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
};
