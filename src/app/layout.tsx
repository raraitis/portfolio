import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/fonts.css';
import { AnimationProvider } from '@/contexts/AnimationContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SimpleNavigation from './components/SimpleNavigation';
import BackgroundElements from './components/BackgroundElements';
import { styles } from '@/styles';
import type { Metadata, Viewport } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Raitis Kraslovskis - Portfolio',
  description:
    'you think it. i make it. you break it. i solve it. universe approves. we happy. thats a deal.',
  // Security-related metadata
  robots: 'index, follow',
  referrer: 'strict-origin-when-cross-origin',
  // Prevent sensitive information leakage
  other: {
    'format-detection': 'telephone=no',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={inter.variable}>
      <body
        className='min-h-screen text-gray-900 font-sans antialiased'
        style={styles.layout.saturnBody}
      >
        {/* Saturn-colored frame border */}
        <div style={styles.layout.saturnFrame} />

        <ErrorBoundary>
          <NavigationProvider>
            <AnimationProvider>
              <BackgroundElements />
              <SimpleNavigation />
              <main>{children}</main>
            </AnimationProvider>
          </NavigationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
