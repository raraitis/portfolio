'use client';

/** Shared full-viewport section wrapper: entrance/exit fade shell plus the right-aligned content container used by MeSection and PortfolioSection. */
import type { ReactNode } from 'react';
import { m } from '@/lib/motion';

interface SectionShellProps {
  /** Fade duration in seconds — animation timing copied verbatim from each section (0.3 Me, 0.4 Portfolio). */
  duration: number;
  children: ReactNode;
}

const SectionShell = ({ duration, children }: SectionShellProps) => {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, ease: 'easeOut' }}
      className='min-h-dvh relative z-10 flex items-center justify-center sm:justify-end px-5 sm:px-12 lg:pr-20'
    >
      <div className='max-w-full sm:max-w-2xl w-full py-16 sm:py-20'>
        {children}
      </div>
    </m.div>
  );
};

export default SectionShell;
