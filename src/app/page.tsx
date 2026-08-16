'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { m, LazyMotion, AnimatePresence, MotionConfig, domAnimation } from '@/lib/motion';
import InteractiveText from './components/InteractiveText';
import MeSection from './components/MeSection';
import PortfolioSection from './components/PortfolioSection';
import { on, emit, type SectionName } from '@/lib/events';

// Loaded on demand — keeps three.js out of the page until the sting is triggered
const LogoSting = dynamic(() => import('./components/LogoSting'), { ssr: false });

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<SectionName>('home');
  const [stingOpen, setStingOpen] = useState(false);
  const closeSting = useCallback(() => setStingOpen(false), []);

  const navigateToSection = useCallback((section: SectionName) => {
    setCurrentSection(section);
    emit('section-changed', section);
  }, []);

  useEffect(() => on('navigate', navigateToSection), [navigateToSection]);

  const renderSection = () => {
    switch (currentSection) {
      case 'me':
        return <MeSection key='me' />;
      case 'portfolio':
        return <PortfolioSection key='portfolio' />;
      default:
        return (
          <m.div
            key='home'
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InteractiveText />
          </m.div>
        );
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion='user'>
        <main className='relative'>
          <AnimatePresence mode='wait'>
            {renderSection()}
          </AnimatePresence>
          {/* Temporary test trigger for the LogoSting boot animation */}
          <button
            onClick={() => setStingOpen(true)}
            className='fixed z-50 bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] font-alien text-[13px] sm:text-base tracking-wide text-gray-600 hover:text-gray-800 active:text-gray-900 transition-colors select-none bg-transparent border-none cursor-pointer py-3 px-2 min-h-[44px] min-w-[44px]'
          >
            ▶ STING
          </button>
          {stingOpen && <LogoSting onDone={closeSting} />}
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
