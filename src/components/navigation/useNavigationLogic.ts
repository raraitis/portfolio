'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NavigationItem } from './NavigationItems';

// Navigation items configuration - EXACTLY preserving original items
const NAV_ITEMS: NavigationItem[] = [
  { word: 'HOME PLANET', section: 'home' },
  { word: 'ME', section: 'me' },
];

/**
 * Navigation Logic Hook
 * Manages navigation state and filtering - EXACTLY preserving original behavior
 */
export function useNavigationLogic() {
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');

  // Listen for section changes - EXACTLY preserving original global communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // TODO: Replace with secure NavigationContext once all components are updated
      (window as any).updateNavSection = (section: 'home' | 'me') => {
        setCurrentSection(section);
      };
    }
  }, []);

  // Handle navigation - EXACTLY preserving original navigation behavior
  const handleNavigate = useCallback((section: 'home' | 'me') => {
    setCurrentSection(section);
    
    // Call global navigation function - EXACTLY preserving original behavior
    if (typeof window !== 'undefined' && (window as any).navigateToSection) {
      (window as any).navigateToSection(section);
    }
  }, []);

  // Filter navigation items based on current section - EXACTLY preserving original logic
  const getVisibleNavItems = useCallback((): NavigationItem[] => {
    if (currentSection === 'home') {
      // On HOME section, show only ME
      return NAV_ITEMS.filter((item) => item.word === 'ME');
    } else if (currentSection === 'me') {
      // On ME section, show only HOME PLANET  
      return NAV_ITEMS.filter((item) => item.word === 'HOME PLANET');
    }
    // Fallback: show all items
    return NAV_ITEMS;
  }, [currentSection]);

  return {
    currentSection,
    visibleItems: getVisibleNavItems(),
    handleNavigate,
  };
}

export default useNavigationLogic;