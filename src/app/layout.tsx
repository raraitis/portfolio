'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from './components/Navigation'
import { usePathname } from 'next/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-gray-900 font-sans antialiased">
        {!isHomePage && <Navigation />}
        <main className={!isHomePage ? "pt-16" : ""}>
          {children}
        </main>
      </body>
    </html>
  )
}
