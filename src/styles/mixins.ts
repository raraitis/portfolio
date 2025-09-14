import { colors } from './colors';
import { spacing, shadows, borderRadius } from './sizing';
import { textStyles, fonts } from './typography';

// Layout mixins as style objects
export const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export const flexColumn = {
  display: 'flex',
  flexDirection: 'column',
} as const;

export const flexRow = {
  display: 'flex',
  flexDirection: 'row',
} as const;

export const absoluteCenter = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
} as const;

export const fixedFull = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
} as const;

// Responsive mixins
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const mediaQuery = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

// Responsive gradient line positioning
export const gradientOffsets = {
  left: {
    mobile: -120, // Mobile: close to edge but visible
    tablet: -300, // Tablet: moderate distance
    desktop: -600, // Desktop: full distance
  },
  right: {
    mobile: 120, // Mobile: close to edge but visible
    tablet: 300, // Tablet: moderate distance
    desktop: 600, // Desktop: full distance
  },
} as const;

// Animation mixins
export const transitions = {
  fast: {
    transition: 'all 0.15s ease-in-out',
  },
  normal: {
    transition: 'all 0.25s ease-in-out',
  },
  slow: {
    transition: 'all 0.4s ease-in-out',
  },
} as const;

export const fadeInKeyframes = {
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
} as const;

export const fadeIn = {
  animation: 'fadeIn 0.3s ease-in-out',
  ...fadeInKeyframes,
} as const;

export const slideInUpKeyframes = {
  '@keyframes slideInUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
} as const;

export const slideInUp = {
  animation: 'slideInUp 0.4s ease-out',
  ...slideInUpKeyframes,
} as const;

// Visual effect mixins
export const glassEffect = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
} as const;

export const cardShadowBase = {
  boxShadow: shadows.md,
  ...transitions.normal,
} as const;

export const cardShadowHover = {
  boxShadow: shadows.lg,
} as const;

export const textGradient = {
  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 50%, ${colors.brand.accent} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const;

// Button mixins
export const buttonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: borderRadius.md,
  fontWeight: '500',
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  ...transitions.fast,
} as const;

export const buttonDisabled = {
  opacity: 0.5,
  cursor: 'not-allowed',
} as const;

export const buttonPrimary = {
  ...buttonBase,
  background: colors.brand.primary,
  color: colors.white,
} as const;

export const buttonPrimaryHover = {
  background: colors.brand.secondary,
  transform: 'translateY(-1px)',
} as const;

export const buttonSecondary = {
  ...buttonBase,
  background: 'transparent',
  color: colors.brand.primary,
  border: `1px solid ${colors.brand.primary}`,
} as const;

export const buttonSecondaryHover = {
  background: colors.brand.primary,
  color: colors.white,
} as const;

// Form mixins
export const inputBase = {
  width: '100%',
  padding: `${spacing.sm} ${spacing.md}`,
  border: `1px solid ${colors.gray[300]}`,
  borderRadius: borderRadius.md,
  fontSize: textStyles.body.md.fontSize,
  lineHeight: textStyles.body.md.lineHeight,
  ...transitions.fast,
} as const;

export const inputFocus = {
  outline: 'none',
  borderColor: colors.brand.primary,
  boxShadow: '0 0 0 3px rgba(139, 125, 107, 0.1)',
} as const;

export const inputPlaceholder = {
  color: colors.gray[400],
} as const;

// Canvas and animation mixins
export const canvasBase = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none' as const,
  zIndex: 0,
} as const;

export const interactiveElement = {
  cursor: 'pointer',
  userSelect: 'none' as const,
  ...transitions.fast,
} as const;

export const interactiveElementHover = {
  transform: 'scale(1.02)',
} as const;

export const interactiveElementActive = {
  transform: 'scale(0.98)',
} as const;

// Typography mixins for common combinations
export const displayText = {
  fontSize: textStyles.display.lg.fontSize,
  lineHeight: textStyles.display.lg.lineHeight,
  fontWeight: textStyles.display.lg.fontWeight,
  color: colors.text.primary,
} as const;

export const displayTextMd = {
  fontSize: textStyles.display.xl.fontSize,
  lineHeight: textStyles.display.xl.lineHeight,
} as const;

export const headingText = {
  fontSize: textStyles.heading.lg.fontSize,
  lineHeight: textStyles.heading.lg.lineHeight,
  fontWeight: textStyles.heading.lg.fontWeight,
  color: colors.text.primary,
} as const;

export const headingTextMd = {
  fontSize: textStyles.heading.xl.fontSize,
  lineHeight: textStyles.heading.xl.lineHeight,
} as const;

export const nameText = {
  fontFamily: fonts.alien, // Alien Encounters font
  fontSize: textStyles.display.md.fontSize, // Desktop: 36px
  lineHeight: textStyles.display.md.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
  // Mobile overrides will be applied via media queries in components
} as const;

export const nameTextMobile = {
  fontFamily: fonts.alien,
  fontSize: textStyles.display.sm.fontSize, // Mobile: 30px (smaller than 36px)
  lineHeight: textStyles.display.sm.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
} as const;

export const bodyText = {
  fontSize: textStyles.body.md.fontSize,
  lineHeight: textStyles.body.md.lineHeight,
  fontWeight: textStyles.body.md.fontWeight,
  color: colors.text.secondary,
} as const;

// Saturn theme mixins
export const saturnBackground = {
  background: `linear-gradient(135deg, ${colors.saturn.lightest} 0%, ${colors.saturn.light} 25%, ${colors.saturn.medium} 50%, ${colors.saturn.dark} 75%, ${colors.saturn.darkest} 100%)`,
} as const;

export const saturnFrame = {
  position: 'fixed' as const,
  top: '20px',
  left: '20px',
  right: '20px',
  bottom: '20px',
  border: `1px solid ${colors.saturn.darkest}`,
  borderImage: `linear-gradient(45deg, ${colors.saturn.darkest} 0%, ${colors.saturn.frame} 25%, ${colors.saturn.darkest} 50%, ${colors.saturn.frameAlt} 75%, ${colors.saturn.darkest} 100%) 1`,
  borderRadius: '8px',
  pointerEvents: 'none' as const,
  zIndex: 50,
} as const;
