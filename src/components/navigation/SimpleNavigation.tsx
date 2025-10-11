'use client';

import React from 'react';
import { NavigationContainer } from './NavigationStyles';
import SaturnRings from './SaturnRings';
import NavigationItems from './NavigationItems';
import useNavigationLogic from './useNavigationLogic';

/**
 * Simple Navigation Component
 * Modular, accessible navigation with Saturn-themed animations
 * EXACTLY preserves original visual appearance and behavior
 */
export function SimpleNavigation() {
  const { visibleItems, handleNavigate } = useNavigationLogic();

  return (
    <NavigationContainer>
      {/* Saturn-like rings container - EXACTLY matching original structure */}
      <div className="relative">
        {/* Saturn rings animation - positioned as absolute children */}
        <SaturnRings />
        
        {/* Navigation content - positioned with z-10 like original */}
        <NavigationItems 
          items={visibleItems} 
          onNavigate={handleNavigate} 
        />
      </div>
    </NavigationContainer>
  );
}

export default SimpleNavigation;