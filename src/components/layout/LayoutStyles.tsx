'use client';

import styled from 'styled-components';
import { styles } from '@/styles';

// Styled components for layout
export const StyledHtml = styled.html`
  /* Will be applied via className with font variable */
`;

export const StyledBody = styled.body.attrs({
  className: 'min-h-screen text-gray-900 font-sans antialiased'
})`
  /* Saturn body styling from original design - EXACTLY preserving visual appearance */
  background: ${styles.layout.saturnBody.background};
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    background-attachment: fixed; /* Ensure gradient stays fixed on mobile */
  }
`;

export const SaturnFrame = styled.div`
  /* Saturn-colored frame border from original design - EXACTLY preserving visual appearance */
  position: ${styles.layout.saturnFrame.position};
  inset: ${styles.layout.saturnFrame.inset}px;
  margin: ${styles.layout.saturnFrame.margin};
  border: ${styles.layout.saturnFrame.border};
  border-image: ${styles.layout.saturnFrame.borderImage};
  border-radius: ${styles.layout.saturnFrame.borderRadius};
  pointer-events: ${styles.layout.saturnFrame.pointerEvents};
  z-index: ${styles.layout.saturnFrame.zIndex};
  
  /* Ensure frame is visible on all screen sizes */
  @media (max-width: 640px) {
    margin: 10px; /* Slightly smaller margin on mobile for better usability */
  }
`;

export const MainContent = styled.main`
  /* Main content area - ensuring proper spacing and accessibility */
  position: relative;
  z-index: 1;
  
  /* Ensure content is accessible on all devices */
  min-height: 100vh;
  
  @media (max-width: 768px) {
    /* Adjust for mobile touch interactions */
    padding: 0 4px;
  }
`;

export const ProvidersWrapper = styled.div`
  /* Wrapper for all context providers - preserving original layout behavior */
  position: relative;
  width: 100%;
  height: 100%;
`;