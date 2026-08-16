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
  { word: 'HOME PLANET', section: 'home', useWarp: false, visibleOn: ['me', 'portfolio'] },
  { word: 'ME', section: 'me', useWarp: false, visibleOn: ['home'] },
  { word: 'PORTFOLIO', section: 'portfolio', useWarp: true, visibleOn: ['me'] },
];

interface Ring {
  /** Negative-margin classes — smaller on mobile to prevent overflow. */
  margin: string;
  border: string;
  /** Extra size beyond the nav content (matches the mobile margin × 2). */
  size: string;
  duration: string;
  direction?: 'reverse';
  rotation: string;
}

// Outer → inner Saturn rings; values copied verbatim from the original divs.
const RINGS: readonly Ring[] = [
  { margin: '-m-5 sm:-m-12', border: 'border-gray-300/15', size: '2.5rem', duration: '60s', rotation: '15deg' },
  { margin: '-m-3 sm:-m-8', border: 'border-gray-400/20', size: '1.5rem', duration: '45s', direction: 'reverse', rotation: '-10deg' },
  { margin: '-m-2 sm:-m-6', border: 'border-gray-500/25', size: '1rem', duration: '30s', rotation: '8deg' },
];

const SimpleNavigation = () => {
  const [currentSection, setCurrentSection] = useState<SectionName>('home');
  // Pending affordance for the ~10.5s warp (IR-N1): set on 'warp-trigger', cleared on the next 'section-changed'.
  const [warping, setWarping] = useState(false);

  useEffect(
    () =>
      on('section-changed', (section) => {
        setCurrentSection(section);
        setWarping(false);
      }),
    []
  );
  useEffect(() => on('warp-trigger', () => setWarping(true)), []);

  // No local write — HomePage owns the section and echoes 'section-changed'
  // synchronously, which is this component's only write path.
  const handleNavigate = (section: SectionName) => {
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
        {RINGS.map((ring) => (
          <div
            key={ring.duration}
            className={`absolute inset-0 ${ring.margin} rounded-full border ${ring.border} animate-spin-slow pointer-events-none`}
            style={{
              width: `calc(100% + ${ring.size})`,
              height: `calc(100% + ${ring.size})`,
              animationDuration: ring.duration,
              animationDirection: ring.direction,
              borderStyle: 'solid',
              borderWidth: '1px 0',
              transform: `rotate(${ring.rotation})`,
            }}
          ></div>
        ))}

        {/* Navigation content */}
        <div className='flex space-x-4 sm:space-x-8 relative z-10'>
          {visibleItems.map((item) => {
            const isWarpPending = item.useWarp && warping;
            return (
              <button
                key={item.word}
                disabled={isWarpPending}
                aria-busy={isWarpPending}
                onClick={() => {
                  if (item.useWarp) {
                    emit('warp-trigger');
                  } else {
                    handleNavigate(item.section);
                  }
                }}
                className={`text-[13px] sm:text-base tracking-wide text-gray-600 hover:text-gray-800 active:text-gray-900 transition-colors select-none font-alien bg-transparent border-none py-3 px-2 min-h-[44px] min-w-[44px] ${
                  isWarpPending ? 'opacity-40 cursor-wait' : 'cursor-pointer'
                }`}
              >
                {item.word}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimpleNavigation;
