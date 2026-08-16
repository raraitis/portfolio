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

  // ?sting=1 auto-plays the sting shortly after load — lets a screen
  // recording start clean, with no cursor or button click in frame
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('sting')) return;
    const timer = setTimeout(() => setStingOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

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
          {stingOpen && <LogoSting onDone={closeSting} />}
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
