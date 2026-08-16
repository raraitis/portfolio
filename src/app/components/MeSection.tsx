'use client';

import { useEffect, useState } from 'react';
import { m } from '@/lib/motion';
import { emit, on } from '@/lib/events';
import SectionShell from './SectionShell';
import { TAGLINE } from '@/lib/content';
import { shimmer } from '@/styles/colors';

// Tagline shimmer gradients — static base layer plus the animated sweep
const SHIMMER_BASE_GRADIENT = `linear-gradient(90deg, ${shimmer.edge} 0%, ${shimmer.mid} 50%, ${shimmer.edge} 100%)`;
const SHIMMER_SWEEP_GRADIENT = `linear-gradient(90deg, transparent 0%, ${shimmer.sweepEdge} 20%, ${shimmer.sweepMid} 50%, ${shimmer.sweepEdge} 80%, transparent 100%)`;

const CONTACT_LINK_CLASS =
  'text-gray-500 hover:text-black active:text-black transition-colors font-alien text-sm sm:text-base tracking-wider py-3 px-3 min-h-[44px] inline-flex items-center';

const MeSection = () => {
  // Pending affordance for the ~10.5s warp (IR-N1): set on 'warp-trigger', cleared on the next 'section-changed'.
  const [warping, setWarping] = useState(false);

  useEffect(() => on('warp-trigger', () => setWarping(true)), []);
  useEffect(() => on('section-changed', () => setWarping(false)), []);

  return (
    <SectionShell duration={0.3}>
      {/* About Section */}
      <div className='mb-6 sm:mb-16'>
        <h1 className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 text-center sm:text-left'>
          Me
        </h1>
      </div>

      <div className='text-center sm:text-left mb-8 sm:mb-20'>
        <p
          className='text-[15px] leading-relaxed sm:text-lg text-gray-500 font-alien relative px-2 sm:px-0'
          style={{
            background: SHIMMER_BASE_GRADIENT,
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
              background: SHIMMER_SWEEP_GRADIENT,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {TAGLINE}
          </m.span>
          {TAGLINE}
        </p>
      </div>

      {/* Contact Section */}
      <div className='text-center sm:text-left'>
        <div className='flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-4'>
          <a href='mailto:raraitis@gmail.com' className={CONTACT_LINK_CLASS}>
            EMAIL
          </a>
          <span className='text-gray-300 font-light select-none'>|</span>
          <a href='tel:+37126351731' className={CONTACT_LINK_CLASS}>
            PHONE
          </a>
          <span className='text-gray-300 font-light select-none'>|</span>
          <button
            onClick={() => emit('warp-trigger')}
            disabled={warping}
            aria-busy={warping}
            className={`${CONTACT_LINK_CLASS} bg-transparent border-none ${
              warping ? 'opacity-40 cursor-wait' : 'cursor-pointer'
            }`}
          >
            PORTFOLIO
          </button>
        </div>
      </div>
    </SectionShell>
  );
};

export default MeSection;
