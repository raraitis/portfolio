// Shared inline-style objects and name text presets.
import { colors } from './colors';
import { zIndex } from './sizing';
import { textStyles, fonts } from './typography';

export const styles = {
  layout: {
    saturnFrame: {
      position: 'fixed' as const,
      inset: 0,
      // margin is controlled by .saturn-frame CSS class (responsive: 10px mobile, 20px desktop)
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

// Name text presets
export const nameText = {
  fontFamily: fonts.alien,
  fontSize: textStyles.display.md.fontSize, // Desktop: 36px
  lineHeight: textStyles.display.md.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
} as const;

export const nameTextMobile = {
  fontFamily: fonts.alien,
  fontSize: textStyles.display.sm.fontSize, // Mobile: 30px
  lineHeight: textStyles.display.sm.lineHeight,
  fontWeight: 400,
  color: colors.black,
  letterSpacing: '-0.02em',
} as const;
