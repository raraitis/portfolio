'use client'

import { useState, useEffect, useMemo } from 'react';
import { on, emit, type SectionName } from '@/lib/events';

interface NavItem {
  word: string;
  section: SectionName;
  useWarp: boolean;
  visibleOn: readonly SectionName[];
}

const NAV_ITEMS: readonly NavItem[] = [
  { word: 'HOME PLANET', section: 'home', useWarp: false, visibleOn: ['me', 'portfolio', 'game'] },
  { word: 'ME', section: 'me', useWarp: false, visibleOn: ['home'] },
  { word: 'PORTFOLIO', section: 'portfolio', useWarp: true, visibleOn: ['me'] },
];

const SimpleNavigation = () => {
  const [currentSection, setCurrentSection] = useState<SectionName>('home');

  useEffect(() => on('section-changed', setCurrentSection), []);

  const handleNavigate = (section: SectionName) => {
    setCurrentSection(section);
    emit('navigate', section);
  };

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.visibleOn.includes(currentSection)),
    [currentSection]
  );

  return (
    <div className='fixed z-50 top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] sm:top-16 sm:right-20'>
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
                if (item.useWarp) {
                  emit('warp-trigger');
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
