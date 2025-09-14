// Typography system
export const fonts = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'sans-serif',
  ].join(', '),

  mono: [
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),

  nabla: ['Nabla', 'Inter', 'sans-serif'].join(', '),
};

// Font weights
export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

// Font sizes with corresponding line heights
export const fontSizes = {
  xs: { size: '0.75rem', lineHeight: '1rem' }, // 12px / 16px
  sm: { size: '0.875rem', lineHeight: '1.25rem' }, // 14px / 20px
  md: { size: '1rem', lineHeight: '1.5rem' }, // 16px / 24px
  lg: { size: '1.125rem', lineHeight: '1.75rem' }, // 18px / 28px
  xl: { size: '1.25rem', lineHeight: '1.75rem' }, // 20px / 28px
  '2xl': { size: '1.5rem', lineHeight: '2rem' }, // 24px / 32px
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px / 36px
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px / 40px
  '5xl': { size: '3rem', lineHeight: '1' }, // 48px / 48px
  '6xl': { size: '3.75rem', lineHeight: '1' }, // 60px / 60px
  '7xl': { size: '4.5rem', lineHeight: '1' }, // 72px / 72px
  '8xl': { size: '6rem', lineHeight: '1' }, // 96px / 96px
  '9xl': { size: '8rem', lineHeight: '1' }, // 128px / 128px
};

// Letter spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Typography presets
export const textStyles = {
  // Display styles
  display: {
    '2xl': {
      fontSize: fontSizes['8xl'].size,
      lineHeight: fontSizes['8xl'].lineHeight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.tight,
    },
    xl: {
      fontSize: fontSizes['6xl'].size,
      lineHeight: fontSizes['6xl'].lineHeight,
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.tight,
    },
    lg: {
      fontSize: fontSizes['5xl'].size,
      lineHeight: fontSizes['5xl'].lineHeight,
      fontWeight: fontWeights.bold,
    },
    md: {
      fontSize: fontSizes['4xl'].size,
      lineHeight: fontSizes['4xl'].lineHeight,
      fontWeight: fontWeights.bold,
    },
    sm: {
      fontSize: fontSizes['3xl'].size,
      lineHeight: fontSizes['3xl'].lineHeight,
      fontWeight: fontWeights.bold,
    },
  },

  // Heading styles
  heading: {
    '2xl': {
      fontSize: fontSizes['2xl'].size,
      lineHeight: fontSizes['2xl'].lineHeight,
      fontWeight: fontWeights.bold,
    },
    xl: {
      fontSize: fontSizes.xl.size,
      lineHeight: fontSizes.xl.lineHeight,
      fontWeight: fontWeights.semibold,
    },
    lg: {
      fontSize: fontSizes.lg.size,
      lineHeight: fontSizes.lg.lineHeight,
      fontWeight: fontWeights.semibold,
    },
    md: {
      fontSize: fontSizes.md.size,
      lineHeight: fontSizes.md.lineHeight,
      fontWeight: fontWeights.semibold,
    },
    sm: {
      fontSize: fontSizes.sm.size,
      lineHeight: fontSizes.sm.lineHeight,
      fontWeight: fontWeights.semibold,
    },
  },

  // Body styles
  body: {
    lg: {
      fontSize: fontSizes.lg.size,
      lineHeight: fontSizes.lg.lineHeight,
      fontWeight: fontWeights.normal,
    },
    md: {
      fontSize: fontSizes.md.size,
      lineHeight: fontSizes.md.lineHeight,
      fontWeight: fontWeights.normal,
    },
    sm: {
      fontSize: fontSizes.sm.size,
      lineHeight: fontSizes.sm.lineHeight,
      fontWeight: fontWeights.normal,
    },
  },

  // Caption/small text
  caption: {
    fontSize: fontSizes.xs.size,
    lineHeight: fontSizes.xs.lineHeight,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.wide,
  },
};

// Alignment and layout for names
export const leftColumn = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
} as const;

export type Fonts = typeof fonts;
export type FontWeights = typeof fontWeights;
export type FontSizes = typeof fontSizes;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;