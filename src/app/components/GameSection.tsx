'use client';

import { m } from '@/lib/motion';

const GameSection = () => {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='min-h-dvh relative z-10 flex items-center justify-center px-5 sm:px-12'
    >
      <div className='text-center'>
        <h1 className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-4'>
          Game
        </h1>
        <p className='text-sm sm:text-lg text-gray-400 font-alien tracking-wider'>
          COMING SOON
        </p>
      </div>
    </m.div>
  );
};

export default GameSection;
