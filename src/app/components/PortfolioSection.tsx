'use client';

import { m } from '@/lib/motion';
import SectionShell from './SectionShell';

interface PortfolioItem {
  title: string;
  url: string;
  description: string;
}

// Add your portfolio projects here
const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: 'Monitec',
    url: 'https://monitec.lv',
    description: 'Technical inspection platform',
  },
  {
    title: 'Bruklene',
    url: 'https://bruklene.cc',
    description: 'Bike shop & service',
  },
  {
    title: 'Amacx',
    url: 'https://amacx.lv',
    description: 'Sports nutrition store',
  },
  {
    title: 'Koud Studio',
    url: 'https://koudstudio.com',
    description: 'Web & mobile studio',
  },
  {
    title: 'Stryda',
    url: 'https://stryda.app/',
    description: 'Activity telemetry, visualized',
  },
];

const PortfolioSection = () => {
  return (
    <SectionShell duration={0.4}>
      <div className='mb-8 sm:mb-16'>
        <h1 className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 text-center sm:text-left'>
          Work
        </h1>
      </div>

      <div className='space-y-6 sm:space-y-8'>
        {PORTFOLIO_ITEMS.map((item, index) => (
          <m.a
            key={item.title}
            href={item.url}
            target='_blank'
            rel='noopener noreferrer'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
            className='block group py-2'
          >
            <div className='flex items-baseline justify-between sm:justify-start gap-3 sm:gap-6'>
              <span className='text-lg sm:text-2xl font-alien text-gray-800 group-hover:text-black transition-colors tracking-wide'>
                {item.title}
              </span>
              <span className='text-xs sm:text-sm font-alien text-gray-400 group-hover:text-gray-600 transition-colors tracking-wider'>
                {item.description}
              </span>
            </div>
            <div className='mt-1 h-px bg-gray-200 group-hover:bg-gray-400 transition-colors' />
          </m.a>
        ))}
      </div>
    </SectionShell>
  );
};

export default PortfolioSection;
