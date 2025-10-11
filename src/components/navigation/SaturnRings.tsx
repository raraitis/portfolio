'use client';

import React from 'react';
import { OuterRing, MiddleRing, InnerRing } from './NavigationStyles';

/**
 * Saturn Rings Animation Component
 * Renders the animated rings around the navigation - EXACTLY preserving original visual behavior
 */
export function SaturnRings() {
  return (
    <>
      {/* Outer ring - EXACTLY preserving original animation timing and direction */}
      <OuterRing />
      
      {/* Middle ring - EXACTLY preserving original reverse animation */}
      <MiddleRing />
      
      {/* Inner ring - EXACTLY preserving original faster animation */}
      <InnerRing />
    </>
  );
}

export default SaturnRings;