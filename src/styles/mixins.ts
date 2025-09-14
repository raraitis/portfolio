import { css } from 'styled-components';
import { colors } from './colors';
import { spacing, shadows, borderRadius } from './sizing';
import { textStyles } from './typography';

// Layout mixins
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

export const flexRow = css`
  display: flex;
  flex-direction: row;
`;

export const absoluteCenter = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export const fixedFull = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

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

// Animation mixins
export const transitions = {
  fast: css`
    transition: all 0.15s ease-in-out;
  `,
  normal: css`
    transition: all 0.25s ease-in-out;
  `,
  slow: css`
    transition: all 0.4s ease-in-out;
  `,
};

export const fadeIn = css`
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const slideInUp = css`
  animation: slideInUp 0.4s ease-out;
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Visual effect mixins
export const glassEffect = css`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

export const cardShadow = css`
  box-shadow: ${shadows.md};
  ${transitions.normal}
  
  &:hover {
    box-shadow: ${shadows.lg};
  }
`;

export const textGradient = css`
  background: linear-gradient(
    135deg,
    ${colors.brand.primary} 0%,
    ${colors.brand.secondary} 50%,
    ${colors.brand.accent} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

// Button mixins
export const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${borderRadius.md};
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  ${transitions.fast}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const buttonPrimary = css`
  ${buttonBase}
  background: ${colors.brand.primary};
  color: ${colors.white};
  
  &:hover:not(:disabled) {
    background: ${colors.brand.secondary};
    transform: translateY(-1px);
  }
`;

export const buttonSecondary = css`
  ${buttonBase}
  background: transparent;
  color: ${colors.brand.primary};
  border: 1px solid ${colors.brand.primary};
  
  &:hover:not(:disabled) {
    background: ${colors.brand.primary};
    color: ${colors.white};
  }
`;

// Form mixins
export const inputBase = css`
  width: 100%;
  padding: ${spacing.sm} ${spacing.md};
  border: 1px solid ${colors.gray[300]};
  border-radius: ${borderRadius.md};
  font-size: ${textStyles.body.md.fontSize};
  line-height: ${textStyles.body.md.lineHeight};
  ${transitions.fast}
  
  &:focus {
    outline: none;
    border-color: ${colors.brand.primary};
    box-shadow: 0 0 0 3px rgba(139, 125, 107, 0.1);
  }
  
  &::placeholder {
    color: ${colors.gray[400]};
  }
`;

// Canvas and animation mixins
export const canvasBase = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

export const interactiveElement = css`
  cursor: pointer;
  user-select: none;
  ${transitions.fast}
  
  &:hover {
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Typography mixins for common combinations
export const displayText = css`
  font-size: ${textStyles.display.lg.fontSize};
  line-height: ${textStyles.display.lg.lineHeight};
  font-weight: ${textStyles.display.lg.fontWeight};
  color: ${colors.text.primary};
  
  ${mediaQuery.md} {
    font-size: ${textStyles.display.xl.fontSize};
    line-height: ${textStyles.display.xl.lineHeight};
  }
`;

export const headingText = css`
  font-size: ${textStyles.heading.lg.fontSize};
  line-height: ${textStyles.heading.lg.lineHeight};
  font-weight: ${textStyles.heading.lg.fontWeight};
  color: ${colors.text.primary};
  
  ${mediaQuery.md} {
    font-size: ${textStyles.heading.xl.fontSize};
    line-height: ${textStyles.heading.xl.lineHeight};
  }
`;

export const bodyText = css`
  font-size: ${textStyles.body.md.fontSize};
  line-height: ${textStyles.body.md.lineHeight};
  font-weight: ${textStyles.body.md.fontWeight};
  color: ${colors.text.secondary};
`;