'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThrowableNavigation from './components/ThrowableNavigation';
import BackgroundElements from './components/BackgroundElements';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={inter.variable}>
      <body className='min-h-screen bg-white text-gray-900 font-sans antialiased'>
        <BackgroundElements />
        <ThrowableNavigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
