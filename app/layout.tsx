import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import ErrorBoundary from '@/components/error-boundary';
import { getGaMeasurementId, getSiteUrl } from '@/lib/site-config';
import './globals.css';

const siteUrl = getSiteUrl();
const gaMeasurementId = getGaMeasurementId();

export const metadata: Metadata = {
  title: {
    default: 'Flowsvault',
    template: '%s | Flowsvault'
  },
  description: 'Flowsvault layanan upload file.',
  keywords: [
    'layanan upload file aman', 
    'penyimpanan file terenkripsi', 
    'file hosting aman',
        'bagikan file secara aman',
    'cloud storage enterprise',
    'file sharing secure',
    'upload file gratis',
    'simpan file online',
    'backup file aman'
  ],
  authors: [{ name: 'Flowsvault team', url: 'https://apps.riflowsxz.my.id' }],
  creator: 'Flowsvault',
  publisher: 'Flowsvault',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Flowsvault',
    title: 'Flowsvault',
    description: 'Layanan upload file. enkripsi end-to-end.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Flowsvault - layanan upload file aman',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowsvault',
    description: 'Layanan upload file.',
    creator: '@flowsvault',
    images: [`${siteUrl}/og-image.jpg`],
  },
  metadataBase: new URL(siteUrl),
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: '/favicon-16x16.svg'
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url: '/favicon-32x32.svg'
      }
    ]
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
  verification: {
    google: 'G-0JXHDYBWC1',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="icon" type="image/svg+xml" href="/favicon-16x16.svg" sizes="16x16" />
        <link rel="icon" type="image/svg+xml" href="/favicon-32x32.svg" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="X-Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta name="application-name" content="Flowsvault" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flowsvault" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />
        <Script id="website-structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Flowsvault',
            description: 'Layanan upload file profesional dengan keamanan tingkat perusahaan dan fitur berbagi canggih.',
            url: siteUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteUrl}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          })}
        </Script>
        <Script id="organization-structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Flowsvault',
            legalName: 'Flowsvault',
            url: siteUrl,
            logo: `${siteUrl}/logo.png`,
            foundingDate: '2024',
            description: 'Layanan upload file.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Yogyakarta',
              addressLocality: 'Yogyakarta',
              addressRegion: 'Yogyakarta',
              postalCode: '55861',
              addressCountry: 'ID'
            },
            contactPoint: [
              {
                '@type': 'ContactPoint',
                telephone: '+62-852-2634-4606',
                contactType: 'customer service',
                areaServed: 'ID',
                availableLanguage: ['Indonesian', 'English']
              }
            ],
            sameAs: [
              'https://www.facebook.com/flowsvault',
              'https://www.twitter.com/flowsvault',
              'https://www.instagram.com/flowsvault',
              'https://www.linkedin.com/company/flowsvault'
            ]
          })}
        </Script>
        <Script id="breadcrumb-structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Beranda',
                item: siteUrl
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Upload',
                item: `${siteUrl}/upload`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Dashboard',
                item: `${siteUrl}/dashboard`
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: 'Tentang',
                item: `${siteUrl}/about`
              }
            ]
          })}
        </Script>
        {gaMeasurementId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        ) : null}
      </head>
      <body
        className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground"
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ErrorBoundary>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none"
              >
                Skip to main content
              </a>

              <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none" />
              <main id="main-content" className="relative">
                {children}
              </main>
            </ErrorBoundary>
            <Script id="sw-register" strategy="afterInteractive">
              {`
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `}
            </Script>

          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
