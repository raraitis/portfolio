'use client';

// Route-level error boundary: a render/effect throw in the page tree shows
// this fallback instead of blanking the site (IR-B1).
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='min-h-dvh flex items-center justify-center px-6'>
      <div className='text-center'>
        <h1 className='text-6xl font-light text-gray-900 mb-4 font-alien'>
          OOPS
        </h1>
        <h2 className='text-2xl font-medium text-gray-600 mb-8 font-alien'>
          Something Broke
        </h2>
        <p className='text-gray-500 mb-8 max-w-md font-alien'>
          An unexpected error interrupted the mission. Try again to keep
          exploring.
        </p>
        <button
          onClick={reset}
          className='inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors font-alien tracking-wide border-none cursor-pointer'
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
