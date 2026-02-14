'use client';

import { useState, useEffect, useCallback } from 'react';
import { m, LazyMotion, AnimatePresence, domAnimation } from '@/lib/motion';
import InteractiveText from './components/InteractiveTextSimple';
import PortfolioSection from './components/PortfolioSection';
import GameSection from './components/GameSection';
import { on, emit, type SectionName } from '@/lib/events';

// ME Section Component
const MeSection = () => {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='min-h-dvh relative z-10 flex items-center justify-center sm:justify-end px-5 sm:px-12 lg:pr-20'
    >
      <div className='max-w-full sm:max-w-2xl w-full py-16 sm:py-20'>
        {/* About Section */}
        <div className='mb-6 sm:mb-16'>
          <h1 className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 text-center sm:text-left'>
            Me
          </h1>
        </div>

        <div className='text-center sm:text-left mb-8 sm:mb-20'>
          <p
            className='text-sm leading-relaxed sm:text-lg text-gray-500 font-alien relative px-2 sm:px-0'
            style={{
              background:
                'linear-gradient(90deg, #9ca3af 0%, #6b7280 50%, #9ca3af 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            <m.span
              initial={{ backgroundPosition: '200% 0' }}
              animate={{ backgroundPosition: '-200% 0' }}
              transition={{
                duration: 2,
                delay: 0.5,
                ease: 'linear',
                repeat: 5,
                repeatType: 'loop',
              }}
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #374151 20%, #1f2937 50%, #374151 80%, transparent 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              you think it. i make it. you break it. i solve it. universe
              approves. we happy. thats a deal.
            </m.span>
            you think it. i make it. you break it. i solve it. universe
            approves. we happy. thats a deal.
          </p>
        </div>

        {/* Contact Section */}
        <div className='text-center sm:text-left'>
          <div className='flex items-center justify-center sm:justify-start gap-1 sm:gap-4'>
            <a
              href='mailto:raraitis@gmail.com'
              className='text-gray-500 hover:text-black active:text-black transition-colors font-alien text-sm sm:text-base tracking-wider py-3 px-3 min-h-[44px] inline-flex items-center'
            >
              EMAIL
            </a>
            <span className='text-gray-300 font-light select-none'>|</span>
            <a
              href='tel:+37126351731'
              className='text-gray-500 hover:text-black active:text-black transition-colors font-alien text-sm sm:text-base tracking-wider py-3 px-3 min-h-[44px] inline-flex items-center'
            >
              PHONE
            </a>
            <span className='text-gray-300 font-light select-none'>|</span>
            <button
              onClick={() => emit('warp-trigger')}
              className='text-gray-500 hover:text-black active:text-black transition-colors font-alien text-sm sm:text-base tracking-wider py-3 px-3 min-h-[44px] inline-flex items-center bg-transparent border-none cursor-pointer'
            >
              PORTFOLIO
            </button>
          </div>
        </div>
      </div>
    </m.div>
  );
};

// Main Component
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
      case 'game':
        return <GameSection key='game' />;
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
      <main className='relative'>
        <AnimatePresence mode='wait'>
          {renderSection()}
        </AnimatePresence>
      </main>
    </LazyMotion>
  );
}
