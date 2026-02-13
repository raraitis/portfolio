'use client';

import { motion } from 'framer-motion';

interface PortfolioItem {
  title: string;
  url: string;
  description: string;
}

// Add your portfolio projects here
const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: 'Monitec',
    url: 'https://monitec.app',
    description: 'Technical inspection platform',
  },
  {
    title: 'Portfolio',
    url: 'https://raitiskraslovskis.com',
    description: '',
  },
];

const PortfolioSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='min-h-dvh relative z-10 flex items-center justify-center sm:justify-end px-5 sm:px-12 lg:pr-20'
    >
      <div className='max-w-full sm:max-w-2xl w-full py-16 sm:py-20'>
        <div className='mb-8 sm:mb-16'>
          <h1 className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 text-center sm:text-left'>
            Work
          </h1>
        </div>

        <div className='space-y-6 sm:space-y-8'>
          {PORTFOLIO_ITEMS.map((item, index) => (
            <motion.a
              key={item.title}
              href={item.url}
              target='_blank'
              rel='noopener noreferrer'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              className='block group'
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
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioSection;
