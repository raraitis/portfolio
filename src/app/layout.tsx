import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/fonts.css';
import { StoreProvider } from '@/stores/StoreProvider';
import ThrowableNavigation from './components/ThrowableNavigation';
import BackgroundElements from './components/BackgroundElements';
import { styles } from '@/styles';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
        
        <StoreProvider>
          <BackgroundElements />
          <ThrowableNavigation />
          <main>{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
