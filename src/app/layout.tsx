import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import '../styles/globals.css';
import '../styles/fonts.css';
import SimpleNavigation from './components/SimpleNavigation';
import BackgroundElements from './components/BackgroundElements';
import { styles as layoutStyles } from '@/styles';
import { colors } from '@/styles/colors';
import type { Metadata, Viewport } from 'next';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-46WR46LP2T';

const SITE_URL = 'https://raitiskraslovskis.com';
const SITE_NAME = 'Raitis Kraslovskis';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'raraitis@gmail.com';
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+37126351731';
const SITE_TITLE = 'Raitis Kraslovskis — Full-Stack Developer & Creative Technologist';
const SITE_DESCRIPTION =
  'Portfolio of Raitis Kraslovskis — full-stack developer specializing in modern web applications, interactive experiences, and creative technology. Based in Latvia.';

// Load-bearing: registers the plain 'Inter' family that the --font-alien /
// --font-sans stacks fall back to — it supplies punctuation glyphs Alien
// Encounters lacks (e.g. the '|' separators in MeSection). Do not remove.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Mobile browser-chrome color — must match the html gradient's top stop
  themeColor: colors.saturn.lightest,
};

// Icons and the Open Graph image are wired via App Router file conventions
// (src/app/icon.svg, apple-icon.png, opengraph-image.tsx) — no icons config here.
export const metadata: Metadata = {
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
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  category: 'technology',
};

// JSON-LD structured data for search engines
function JsonLd() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
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
      name: SITE_NAME,
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
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
    <html lang='en' dir='ltr' className={inter.variable}>
      <head>
        <JsonLd />
      </head>
      <body
        className='min-h-svh text-gray-900 font-sans antialiased'
      >
        {/* Preload the primary display face (body default) — React hoists this
            into <head>; font preloads require crossOrigin even same-origin */}
        <link
          rel='preload'
          href='/fonts/Alien-Encounters-Regular.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
        {/* Saturn-colored frame border */}
        <div className='saturn-frame' aria-hidden='true' style={layoutStyles.layout.saturnFrame} />

        <BackgroundElements />
        <SimpleNavigation />
        <main id='main-content'>{children}</main>

        {/* Noscript fallback so crawlers without JS still see the essentials */}
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Raitis Kraslovskis — Full-Stack Developer</h1>
            <p>{SITE_DESCRIPTION}</p>
            <p>
              Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
              | <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a>
            </p>
          </div>
        </noscript>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
