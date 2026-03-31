export const colors = {
  primary: '#db1a1a',
  primaryDark: '#b51026',
  primaryLight: '#E8F0FE',

  success: '#057A55',
  successLight: '#DEF7EC',

  warning: '#D97706',

  danger: '#C81E1E',
  dangerLight: '#FDE8E8',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F8',

  text: '#111928',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  border: '#E5E7EB',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  mono: { fontSize: 15, fontFamily: 'monospace' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
