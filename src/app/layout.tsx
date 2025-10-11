import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/fonts.css';
import RootLayoutContent from '@/components/layout/RootLayoutContent';
import { SimpleNavigation } from '@/components/navigation';
import BackgroundElements from './components/BackgroundElements';
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
      <RootLayoutContent>
        {/* Background Elements - Preserving EXACT original placement and behavior */}
        <BackgroundElements />
        {/* Navigation - Preserving EXACT original placement and behavior */}
        <SimpleNavigation />
        {children}
      </RootLayoutContent>
    </html>
  );
}
