import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description:
    'The page you are looking for could not be found. Return to Raitis Kraslovskis\' portfolio.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <section
      className='min-h-screen flex items-center justify-center px-6'
      aria-labelledby='not-found-heading'
    >
      <div className='text-center'>
        <h1
          id='not-found-heading'
          className='text-6xl font-light text-gray-900 mb-4 font-alien'
        >
          404
        </h1>
        <h2 className='text-2xl font-medium text-gray-600 mb-8 font-alien'>
          Page Not Found
        </h2>
        <p className='text-gray-500 mb-8 max-w-md font-alien'>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href='/'
          aria-label='Return to homepage'
          className='inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors font-alien tracking-wide'
        >
          ← BACK TO THE FUTURE
        </Link>
      </div>
    </section>
  );
}
