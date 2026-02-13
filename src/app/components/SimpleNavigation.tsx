'use client'

import { useState, useEffect } from 'react';

const SimpleNavigation = () => {
  const [currentSection, setCurrentSection] = useState<'home' | 'me' | 'portfolio'>('home');

  // Listen for section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).updateNavSection = (section: 'home' | 'me' | 'portfolio') => {
        setCurrentSection(section);
      };
    }
  }, []);

  const handleNavigate = (section: 'home' | 'me' | 'portfolio') => {
    setCurrentSection(section);
    if (typeof window !== 'undefined' && (window as any).navigateToSection) {
      (window as any).navigateToSection(section);
    }
  };

  // Define navigation items
  const navItems = [
    { word: 'HOME PLANET', section: 'home' as const, useWarp: false },
    { word: 'ME', section: 'me' as const, useWarp: false },
    { word: 'PORTFOLIO', section: 'portfolio' as const, useWarp: true },
  ];

  // Filter navigation items based on current section
  const getVisibleNavItems = () => {
    if (currentSection === 'home') {
      return navItems.filter((item) => item.word === 'ME');
    } else if (currentSection === 'me') {
      // ME page shows HOME PLANET + PORTFOLIO
      return navItems.filter((item) => item.word === 'HOME PLANET' || item.word === 'PORTFOLIO');
    } else {
      // Portfolio page shows HOME PLANET
      return navItems.filter((item) => item.word === 'HOME PLANET');
    }
  };

  const visibleItems = getVisibleNavItems();

  return (
    <div className='fixed top-4 right-4 sm:top-16 sm:right-20 z-50'>
      {/* Saturn-like rings container */}
      <div className='relative'>
        {/* Outer ring - smaller on mobile to prevent overflow */}
        <div
          className='absolute inset-0 -m-5 sm:-m-12 rounded-full border border-gray-300/15 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 2.5rem)',
            height: 'calc(100% + 2.5rem)',
            animationDuration: '60s',
            borderStyle: 'solid',
            borderWidth: '1px 0',
            transform: 'rotate(15deg)',
          }}
        ></div>

        {/* Middle ring */}
        <div
          className='absolute inset-0 -m-3 sm:-m-8 rounded-full border border-gray-400/20 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 1.5rem)',
            height: 'calc(100% + 1.5rem)',
            animationDuration: '45s',
            animationDirection: 'reverse',
            borderStyle: 'solid',
            borderWidth: '1px 0',
            transform: 'rotate(-10deg)',
          }}
        ></div>

        {/* Inner ring */}
        <div
          className='absolute inset-0 -m-2 sm:-m-6 rounded-full border border-gray-500/25 animate-spin-slow pointer-events-none'
          style={{
            width: 'calc(100% + 1rem)',
            height: 'calc(100% + 1rem)',
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
              onClick={() => {
                if (item.useWarp && (window as any).triggerPortfolioWarp) {
                  (window as any).triggerPortfolioWarp();
                } else {
                  handleNavigate(item.section);
                }
              }}
              className='text-xs sm:text-base tracking-wide text-gray-600 hover:text-gray-800 active:text-gray-900 transition-colors select-none font-alien bg-transparent border-none cursor-pointer py-3 px-2 min-h-[44px] min-w-[44px]'
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