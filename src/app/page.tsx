'use client';

import { useState, useEffect, useCallback } from 'react';
import { m, LazyMotion, AnimatePresence, MotionConfig, domAnimation } from '@/lib/motion';
import InteractiveText from './components/InteractiveText';
import MeSection from './components/MeSection';
import PortfolioSection from './components/PortfolioSection';
import { on, emit, type SectionName } from '@/lib/events';

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<SectionName>('home');

  const navigateToSection = useCallback((section: SectionName) => {
    setCurrentSection(section);
    emit('background-section', section);
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
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
