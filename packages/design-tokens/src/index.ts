export const colors = {
  primary: '#2A7C13',
  primaryDark: '#1E5B0E',
  primaryLight: '#389A1B',
  primarySurface: '#EBF7E7',
  
  secondary: '#76C457',
  secondaryDark: '#5E9E45',
  secondaryLight: '#94D77B',
  secondarySurface: '#F0F9ED',

  cream: '#FFF8CF',
  creamDark: '#F7EDBA',
  creamLight: '#FFFDF0',

  warmBeige: '#FBE6C2',
  beigeDark: '#ECCEA1',
  beigeLight: '#FDF4E7',

  // Neutrals & Surface
  background: '#FDFBF7',
  surface: '#FFFFFF',
  surfaceSubtle: '#F9FAFB',
  border: '#E5E7EB',
  borderDark: '#D1D5DB',

  // Typography
  textPrimary: '#1F2937',     // Dark Charcoal
  textSecondary: '#4B5563',   // Medium Slate
  textMuted: '#6B7280',       // Light Slate
  textInverted: '#FFFFFF',
  textBrand: '#2A7C13',

  // Status indicators
  success: '#2A7C13',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  neutral: '#6B7280'
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

export const radii = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  card: '0 2px 8px -2px rgba(42, 124, 19, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
