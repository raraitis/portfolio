'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 pointer-events-none'>
      <div className='flex justify-end items-center h-20 px-8'>
        <div className='flex space-x-8 pointer-events-auto'>
          <Link
            href='/'
            className={`text-sm tracking-wide transition-colors duration-300 ${
              pathname === '/'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            HOME
          </Link>
          <Link
            href='/about'
            className={`text-sm tracking-wide transition-colors duration-300 ${
              pathname === '/about'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ABOUT
          </Link>
          <Link
            href='/contact'
            className={`text-sm tracking-wide transition-colors duration-300 ${
              pathname === '/contact'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            CONTACT
          </Link>
        </div>
      </div>
    </nav>
  );
}
