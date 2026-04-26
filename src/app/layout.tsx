import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import '../styles/globals.css';
import '../styles/fonts.css';
import SimpleNavigation from './components/SimpleNavigation';
import BackgroundElements from './components/BackgroundElements';
import { styles as layoutStyles } from '@/styles';
import type { Metadata, Viewport } from 'next';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-46WR46LP2T';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const SITE_URL = 'https://raitiskraslovskis.com';
const SITE_NAME = 'Raitis Kraslovskis';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'raraitis@gmail.com';
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+37126351731';
const SITE_TITLE = 'Raitis Kraslovskis — Full-Stack Developer & Creative Technologist';
const SITE_DESCRIPTION =
  'Portfolio of Raitis Kraslovskis — full-stack developer specializing in modern web applications, interactive experiences, and creative technology. Based in Latvia.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export const metadata: Metadata = {
  // === Core Metadata ===
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Raitis Kraslovskis',
    'full-stack developer',
    'web developer',
    'portfolio',
    'React developer',
    'Next.js developer',
    'creative technologist',
    'Latvia developer',
    'frontend developer',
    'interactive web experiences',
    'TypeScript developer',
    'modern web applications',
  ],
  authors: [{ name: 'Raitis Kraslovskis', url: SITE_URL }],
  creator: 'Raitis Kraslovskis',
  publisher: 'Raitis Kraslovskis',

  // === Canonical & Alternates ===
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },

  // === Robots / Indexing ===
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // === Open Graph (Facebook, LinkedIn, etc.) ===
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Raitis Kraslovskis — Full-Stack Developer Portfolio',
        type: 'image/png',
      },
    ],
  },

  // === Twitter Card ===
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@raitiskraslovskis',
  },

  // === Icons & Manifest ===
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',

  // === Apple Web App ===
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },

  // === Verification (add your real IDs when ready) ===
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  // },

  // === Category ===
  category: 'technology',
};

// JSON-LD Structured Data
function JsonLd() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Raitis Kraslovskis',
    url: SITE_URL,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    jobTitle: 'Full-Stack Developer',
    description: SITE_DESCRIPTION,
    knowsAbout: [
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'Web Development',
      'Frontend Development',
      'Full-Stack Development',
      'Interactive Web Experiences',
      'Creative Technology',
    ],
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LV',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    author: {
      '@type': 'Person',
      name: 'Raitis Kraslovskis',
    },
  };

  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: SITE_TITLE,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    mainEntity: {
      '@type': 'Person',
      name: 'Raitis Kraslovskis',
      jobTitle: 'Full-Stack Developer',
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profilePageSchema),
        }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={inter.variable} dir='ltr'>
      <head>
        <JsonLd />
      </head>
      <body
        className='min-h-svh text-gray-900 font-sans antialiased'
      >
        {/* Saturn-colored frame border */}
        <div className='saturn-frame' aria-hidden='true' style={layoutStyles.layout.saturnFrame} />

        <BackgroundElements />
        <SimpleNavigation />
        <main id='main-content' role='main'>
          {children}
        </main>

        {/* Noscript fallback for SEO: ensures crawlers without JS see content */}
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Raitis Kraslovskis — Full-Stack Developer</h1>
            <p>
              Portfolio of Raitis Kraslovskis — full-stack developer specializing in
              modern web applications, interactive experiences, and creative technology.
            </p>
            <p>Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> | <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a></p>
          </div>
        </noscript>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
