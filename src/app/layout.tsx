import { Inter } from 'next/font/google';
import '../styles/globals.css';
import '../styles/fonts.css';
import SimpleNavigation from './components/SimpleNavigation';
import BackgroundElements from './components/BackgroundElements';
import { styles as layoutStyles } from '@/styles';
import { TAGLINE } from '@/lib/content';
import type { Metadata, Viewport } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f1e8',
};

export const metadata: Metadata = {
  title: 'Raitis Kraslovskis - Portfolio',
  description: TAGLINE,
  appleWebApp: {
    statusBarStyle: 'black-translucent',
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
        className='min-h-svh text-gray-900 font-sans antialiased'
      >
        {/* Saturn-colored frame border */}
        <div className='saturn-frame' style={layoutStyles.layout.saturnFrame} />

        <BackgroundElements />
        <SimpleNavigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
