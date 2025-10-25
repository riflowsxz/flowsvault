import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
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
  keywords: ['layanan upload file aman', 'penyimpanan file terenkripsi', 'file hosting aman', 'bagikan file secara aman'],
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



        <meta name="application-name" content="Flowsvault" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />
        {gaMeasurementId && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
        )}
        {gaMeasurementId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaMeasurementId}');`,
            }}
          />
        )}
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


          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
