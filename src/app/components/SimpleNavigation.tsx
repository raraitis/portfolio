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
    { word: 'HOME PLANET', section: 'home' as const },
    { word: 'ME', section: 'me' as const },
  ];

  // Filter navigation items based on current section
  const getVisibleNavItems = () => {
    if (currentSection === 'home') {
      // On HOME section, show only ME
      return navItems.filter((item) => item.word === 'ME');
    } else if (currentSection === 'me') {
      // On ME section, show only HOME PLANET
      return navItems.filter((item) => item.word === 'HOME PLANET');
    }
    // Fallback: show all items
    return navItems;
  };

  const visibleItems = getVisibleNavItems();

  return (
    <div className='fixed top-8 right-8 sm:top-16 sm:right-20 z-50'>
      {/* Saturn-like rings container */}
      <div className='relative'>
        {/* Outer ring */}
        <div
          className='absolute inset-0 -m-8 sm:-m-12 rounded-full border border-gray-300/15 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 4rem)',
            height: 'calc(100% + 4rem)',
            animationDuration: '60s',
            borderStyle: 'solid',
            borderWidth: '1px 0',
            transform: 'rotate(15deg)',
          }}
        ></div>

        {/* Middle ring */}
        <div
          className='absolute inset-0 -m-6 sm:-m-8 rounded-full border border-gray-400/20 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 3rem)',
            height: 'calc(100% + 3rem)',
            animationDuration: '45s',
            animationDirection: 'reverse',
            borderStyle: 'solid',
            borderWidth: '1px 0',
            transform: 'rotate(-10deg)',
          }}
        ></div>

        {/* Inner ring */}
        <div
          className='absolute inset-0 -m-4 sm:-m-6 rounded-full border border-gray-500/25 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 2rem)',
            height: 'calc(100% + 2rem)',
            animationDuration: '30s',
            borderStyle: 'solid',
            borderWidth: '1px 0',
            transform: 'rotate(8deg)',
          }}
        ></div>

        {/* Navigation content */}
        <div className='flex space-x-4 sm:space-x-8 relative z-10'>
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
    </div>
  );
};

export default SimpleNavigation;