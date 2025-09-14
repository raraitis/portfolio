'use client'

import { useState, useEffect } from 'react';

const SimpleNavigation = () => {
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');

  // Listen for section changes
  useEffect(() => {
    // Listen for global section changes
    if (typeof window !== 'undefined') {
      (window as any).updateNavSection = (section: 'home' | 'me') => {
        setCurrentSection(section);
      };
    }
  }, []);

  const handleNavigate = (section: 'home' | 'me') => {
    setCurrentSection(section);
    // Call global navigation function
    if (typeof window !== 'undefined' && (window as any).navigateToSection) {
      (window as any).navigateToSection(section);
    }
  };

  // Define navigation items
  const navItems = [
    { word: 'HOME', section: 'home' as const },
    { word: 'ME', section: 'me' as const },
  ];

  // Filter navigation items based on current section
  const getVisibleNavItems = () => {
    if (currentSection === 'home') {
      // On HOME section, show only ME
      return navItems.filter((item) => item.word === 'ME');
    } else if (currentSection === 'me') {
      // On ME section, show only HOME
      return navItems.filter((item) => item.word === 'HOME');
    }
    // Fallback: show all items
    return navItems;
  };

  const visibleItems = getVisibleNavItems();

  return (
    <div className='fixed top-8 right-8 sm:top-16 sm:right-20 z-50'>
      <div className='flex space-x-4 sm:space-x-8'>
        {visibleItems.map((item) => (
          <button
            key={item.word}
            onClick={() => handleNavigate(item.section)}
            className='text-sm sm:text-base tracking-wide text-gray-600 hover:text-gray-800 transition-colors select-none font-alien bg-transparent border-none cursor-pointer py-2 px-1 min-h-[44px]'
          >
            {item.word}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleNavigation;