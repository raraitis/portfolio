// Main styles export
export * from './colors';
export * from './sizing';
export * from './typography';
export * from './mixins';

// Style object for components that need CSS-in-JS styles
import { colors } from './colors';
import { spacing, zIndex } from './sizing';
import { textStyles, fonts } from './typography';

export const styles = {
  // Canvas styles
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

  // Layout styles
  layout: {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${spacing.lg}`,
    },
    
    centered: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    },
    
    fixedFullscreen: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    },
    
    offsetContainer: {
      transform: 'translateX(-190px)',
    },
    
    nameContainer: {
      width: '600px',
      height: '200px',
    },
  },

  // Typography styles
  text: {
    display: {
      large: {
        fontSize: textStyles.display.xl.fontSize,
        lineHeight: textStyles.display.xl.lineHeight,
        fontWeight: textStyles.display.xl.fontWeight,
        letterSpacing: textStyles.display.xl.letterSpacing,
        color: colors.text.primary,
        fontFamily: fonts.sans,
      },
      
      medium: {
        fontSize: textStyles.display.lg.fontSize,
        lineHeight: textStyles.display.lg.lineHeight,
        fontWeight: textStyles.display.lg.fontWeight,
        color: colors.text.primary,
        fontFamily: fonts.sans,
      },
    },
    
    heading: {
      fontSize: textStyles.heading.xl.fontSize,
      lineHeight: textStyles.heading.xl.lineHeight,
      fontWeight: textStyles.heading.xl.fontWeight,
      color: colors.text.primary,
      fontFamily: fonts.sans,
    },
    
    body: {
      fontSize: textStyles.body.md.fontSize,
      lineHeight: textStyles.body.md.lineHeight,
      fontWeight: textStyles.body.md.fontWeight,
      color: colors.text.secondary,
      fontFamily: fonts.sans,
    },
    
    nameSpacing: {
      marginTop: '80px',
    },
  },

  // Interactive elements
  interactive: {
    navigation: {
      position: 'fixed' as const,
      top: spacing.lg,
      right: spacing.lg,
      zIndex: zIndex.docked,
      userSelect: 'none' as const,
    },
    
    draggable: {
      cursor: 'grab',
      transition: 'all 0.2s ease',
      userSelect: 'none' as const,
      
      ':active': {
        cursor: 'grabbing',
      },
    },
    
    navWord: {
      position: 'absolute' as const,
      touchAction: 'none',
      zIndex: 100,
    },
    
    navContainer: {
      width: '300px',
      height: '50px',
    },
  },

  // Gradient styles
  gradients: {
    brand: {
      primary: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 50%, ${colors.brand.accent} 100%)`,
    },
    
    line: {
      vertical: `linear-gradient(to bottom, ${colors.brand.primary} 0%, ${colors.brand.secondary} 20%, ${colors.brand.accent} 40%, ${colors.brand.light} 60%, rgba(200, 190, 168, 0.6) 80%, rgba(200, 190, 168, 0.2) 90%, transparent 100%)`,
    },
  },

  // Animation styles
  animations: {
    fadeIn: {
      animation: 'fadeIn 0.3s ease-in-out',
    },
    
    slideInUp: {
      animation: 'slideInUp 0.4s ease-out',
    },
  },

  // Responsive breakpoints for inline styles
  breakpoints: {
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',
  },
};