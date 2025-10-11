'use client';

import React from 'react';
import { NavigationContent, NavigationButton } from './NavigationStyles';

export interface NavigationItem {
  word: string;
  section: 'home' | 'me';
}

interface NavigationItemsProps {
  items: NavigationItem[];
  onNavigate: (section: 'home' | 'me') => void;
}

/**
 * Navigation Items Component
 * Renders the navigation buttons - EXACTLY preserving original behavior and styling
 */
export function NavigationItems({ items, onNavigate }: NavigationItemsProps) {
  return (
    <NavigationContent>
      {items.map((item) => (
        <NavigationButton
          key={item.word}
          onClick={() => onNavigate(item.section)}
          type="button"
          aria-label={`Navigate to ${item.word.toLowerCase()}`}
        >
          {item.word}
        </NavigationButton>
      ))}
    </NavigationContent>
  );
}

export default NavigationItems;