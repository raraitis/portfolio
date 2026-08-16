// Typography system
export const fonts = {
  // Resolves against the @theme block in src/styles/globals.css (SSOT-1) —
  // that block is the single source of truth for the stack. The var()
  // fallback mirrors it verbatim solely for global-error.tsx, which renders
  // without the compiled CSS (and thus without --font-alien) present.
  alien:
    "var(--font-alien, 'Alien Encounters', 'Inter', system-ui, sans-serif)",
};

// Font sizes with corresponding line heights
const fontSizes = {
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px / 36px
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px / 40px
};

// Font weights
const fontWeights = {
  bold: 700,
};

// Typography presets
export const textStyles = {
  // Display styles
  display: {
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
};
