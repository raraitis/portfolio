import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/stores/StoreProvider';
import ThrowableNavigation from './components/ThrowableNavigation';
import BackgroundElements from './components/BackgroundElements';

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
        style={{
          background: `linear-gradient(135deg, 
            #f5f1e8 0%, 
            #ede4d3 25%, 
            #e8dcc6 50%, 
            #ddd0bb 75%, 
            #d4c4a8 100%
          )`
        }}
      >
        {/* Saturn-colored frame border */}
        <div 
          className='fixed inset-0 pointer-events-none z-50'
          style={{
            margin: '20px',
            border: '1px solid #d4c4a8',
            borderImage: `linear-gradient(45deg, 
              #d4c4a8 0%, 
              #c9b896 25%, 
              #d4c4a8 50%, 
              #beac84 75%, 
              #d4c4a8 100%
            ) 1`,
            borderRadius: '2px',
          }}
        />
        
        <StoreProvider>
          <BackgroundElements />
          <ThrowableNavigation />
          <main>{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
