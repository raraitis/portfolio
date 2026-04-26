'use client';

import { m } from '@/lib/motion';

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
    description: '',
  },
  {
    title: 'Lauku Karte',
    url: 'https://laukukarte.lv',
    description: '',
  },
  {
    title: 'Pilis un Muizas',
    url: 'https://pilisunmuizas.lv',
    description: '',
  },
  {
    title: 'Bruklene',
    url: 'https://bruklene.cc',
    description: '',
  },
  {
    title: 'Koud Studio',
    url: 'https://koudstudio.com',
    description: '',
  },
  {
    title: 'Austina',
    url: 'https://austina.run',
    description: '',
  },
  {
    title: 'Portfolio',
    url: 'https://raitiskraslovskis.com',
    description: '',
  },
];

const PortfolioSection = () => {
  return (
    <m.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className='min-h-dvh relative z-10 flex items-center justify-center sm:justify-end px-5 sm:px-12 lg:pr-20'
      aria-labelledby='portfolio-heading'
    >
      <div className='max-w-full sm:max-w-2xl w-full py-16 sm:py-20'>
        <header className='mb-8 sm:mb-16'>
          <h1 id='portfolio-heading' className='text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 mb-3 sm:mb-8 text-center sm:text-left'>
            Work
          </h1>
        </header>

        <ul className='space-y-6 sm:space-y-8 list-none p-0 m-0' role='list'>
          {PORTFOLIO_ITEMS.map((item, index) => (
            <li key={item.title}>
              <m.a
                href={item.url}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`View project: ${item.title}${item.description ? ` — ${item.description}` : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                className='block group'
              >
                <article className='flex items-baseline justify-between sm:justify-start gap-3 sm:gap-6'>
                  <h2 className='text-lg sm:text-2xl font-alien text-gray-800 group-hover:text-black transition-colors tracking-wide m-0'>
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className='text-xs sm:text-sm font-alien text-gray-400 group-hover:text-gray-600 transition-colors tracking-wider m-0'>
                      {item.description}
                    </p>
                  )}
                </article>
                <div className='mt-1 h-px bg-gray-200 group-hover:bg-gray-400 transition-colors' aria-hidden='true' />
              </m.a>
            </li>
          ))}
        </ul>
      </div>
    </m.section>
  );
};

export default PortfolioSection;
