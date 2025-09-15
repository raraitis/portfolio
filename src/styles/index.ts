// Simplified styles - only includes what's actually being used
import { colors } from './colors';
import { spacing, zIndex } from './sizing';
import { textStyles, fonts } from './typography';

export const styles = {
  // Canvas styles - used in BackgroundElements.tsx
  canvas: {
    background: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
      zIndex: zIndex.base,
      background: 'transparent',
    },
  },

  // Layout styles - used in layout.tsx
  layout: {
    // Saturn theme styles
    saturnBody: {
      background: `linear-gradient(135deg, 
        ${colors.saturn.lightest} 0%, 
        ${colors.saturn.light} 25%, 
        ${colors.saturn.medium} 50%, 
        ${colors.saturn.dark} 75%, 
        ${colors.saturn.darkest} 100%
      )`,
    },

    saturnFrame: {
      position: 'fixed' as const,
      inset: 0,
      margin: '20px',
      border: `1px solid ${colors.saturn.darkest}`,
      borderImage: `linear-gradient(45deg, 
        ${colors.saturn.darkest} 0%, 
        ${colors.saturn.frame} 25%, 
        ${colors.saturn.darkest} 50%, 
        ${colors.saturn.frameAlt} 75%, 
        ${colors.saturn.darkest} 100%
      ) 1`,
      borderRadius: '8px',
      pointerEvents: 'none' as const,
      zIndex: zIndex.modal,
    },
  },
};

// Typography styles - used in InteractiveTextSimple.tsx
export const nameText = {
  fontFamily: fonts.alien, // Alien Encounters font
  fontSize: textStyles.display.md.fontSize, // Desktop: 36px
  lineHeight: textStyles.display.md.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
} as const;

export const nameTextMobile = {
  fontFamily: fonts.alien,
  fontSize: textStyles.display.sm.fontSize, // Mobile: 30px (smaller than 36px)
  lineHeight: textStyles.display.sm.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
} as const;