'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveText from './components/InteractiveTextSimple';

// ME Section Component
const MeSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='min-h-screen bg-white relative z-10 flex items-center justify-center'
    >
      <div className='max-w-4xl mx-auto px-6 py-20'>
        {/* About Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className='mb-16'
        >
          <h1 className='text-5xl md:text-6xl font-light text-gray-900 mb-8 text-center'>
            Me
          </h1>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className='text-center mb-20'
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 1.2,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className='text-lg text-gray-500 font-alien relative'
            style={{
              background:
                'linear-gradient(90deg, #9ca3af 0%, #6b7280 50%, #9ca3af 100%)',
              backgroundSize: '200% 100%',
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
                delay: 1.2,
                ease: 'linear',
                repeat: Infinity,
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
          </motion.p>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
          className='space-y-16'
        >
          <div className='space-y-8'>
            <div className='space-y-6 text-center'>
              <div className='flex justify-center'>
                <span className='text-gray-900 w-20'>Email</span>
                <a
                  href='mailto:raraitis@gmail.com'
                  className='text-gray-600 hover:text-black transition-colors ml-4'
                >
                  raraitis@gmail.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>
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
