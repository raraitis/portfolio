'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveText from './components/InteractiveTextSimple';

// ME Section Component
const MeSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='min-h-screen relative z-10 flex items-center justify-end px-8 sm:px-12 lg:pr-20'
    >
      <div className='max-w-full sm:max-w-2xl w-full py-12 sm:py-20'>
        {/* About Section */}
        <div className='mb-12 sm:mb-16'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-6 sm:mb-8 text-center sm:text-left'>
            Me
          </h1>
        </div>

        <div className='text-center sm:text-left mb-16 sm:mb-20'>
          <p
            className='text-base sm:text-lg text-gray-500 font-alien relative'
            style={{
              background:
                'linear-gradient(90deg, #9ca3af 0%, #6b7280 50%, #9ca3af 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            <motion.span
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
            </motion.span>
            you think it. i make it. you break it. i solve it. universe
            approves. we happy. thats a deal.
          </p>
        </div>

        {/* Contact Section */}
        <div className='space-y-12 sm:space-y-16'>
          <div className='space-y-6 sm:space-y-8'>
            <div className='space-y-4 sm:space-y-6 text-center sm:text-left'>
              {/* Email */}
              <div className='flex items-center justify-center sm:justify-start'>
                <svg
                  className='w-5 h-5 sm:w-6 sm:h-6 text-gray-900 mr-3 sm:mr-4 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
                <a
                  href='mailto:raraitis@gmail.com'
                  className='text-gray-600 hover:text-black transition-colors font-alien text-sm sm:text-base break-all sm:break-normal'
                >
                  raraitis@gmail.com
                </a>
              </div>

              {/* Phone */}
              <div className='flex items-center justify-center sm:justify-start'>
                <svg
                  className='w-5 h-5 sm:w-6 sm:h-6 text-gray-900 mr-3 sm:mr-4 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                  />
                </svg>
                <a
                  href='tel:+37126351731'
                  className='text-gray-600 hover:text-black transition-colors font-alien text-sm sm:text-base'
                >
                  +371 26 351 731
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export default function HomePage() {
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');

  // Global state for navigation
  if (typeof window !== 'undefined') {
    (window as any).navigateToSection = (section: 'home' | 'me') => {
      setCurrentSection(section);
      // Also notify background component
      if ((window as any).setBackgroundSection) {
        (window as any).setBackgroundSection(section);
      }
    };
  }

  return (
    <main className='relative'>
      <AnimatePresence mode='wait'>
        {currentSection === 'home' ? (
          <motion.div
            key='home'
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InteractiveText />
          </motion.div>
        ) : (
          <MeSection key='me' />
        )}
      </AnimatePresence>
    </main>
  );
}
