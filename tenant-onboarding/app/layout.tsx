import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/errors/ErrorBoundary';
import { PostHogProvider } from '../lib/analytics/posthog';
import "./globals.css";

// Serif font for headings - editorial feel
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

// Sans-serif font for body text
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tesserix.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1F1E1C',
};

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'Tesserix - Launch Your Online Store in Minutes',
    template: '%s | Tesserix',
  },
  description: 'The simplest way to create and launch your online store. Start free for 12 months, then just ₹500/mo. No coding required. Built for creators, makers, and small businesses.',
  keywords: [
    'ecommerce platform',
    'online store builder',
    'create online store',
    'sell online',
    'ecommerce website',
    'small business ecommerce',
    'shopify alternative',
    'free online store',
    'start online business',
    'marketplace platform',
    'D2C ecommerce',
    'direct to consumer',
  ],
  authors: [{ name: 'Tesserix' }],
  creator: 'Tesserix',
  publisher: 'Tesserix',

  // Robots
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

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Tesserix',
    title: 'Tesserix - Launch Your Online Store in Minutes',
    description: 'The simplest way to create and launch your online store. Start free for 12 months, then ₹500/mo. No coding required. Built for creators and small businesses.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Tesserix - E-commerce Made Simple',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Tesserix - Launch Your Online Store in Minutes',
    description: 'The simplest way to create and launch your online store. Start free for 12 months, then ₹500/mo. No coding required.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@tesserix',
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/manifest.json',

  // Canonical
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },

  // Category
  category: 'technology',

  // Additional
  applicationName: 'Tesserix',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Tesserix',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://twitter.com/tesserix',
        'https://linkedin.com/company/tesserix',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@tesserix.app',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Tesserix',
      description: 'The simplest way to create and launch your online store',
      publisher: { '@id': `${siteUrl}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'Tesserix',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free for 12 months, then ₹500/month',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Unlimited products',
        'Custom domain support',
        'Mobile-optimized storefront',
        'Built-in SEO tools',
        'Payment processing',
        'Order management',
        'Customer accounts',
        'Analytics dashboard',
        '24/7 support',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: "I'm not very technical. Can I still use this?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. We built this for people who want to focus on their business, not on learning software. If you can use email, you can use Tesserix.',
          },
        },
        {
          '@type': 'Question',
          name: 'What happens after the 12 months free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "After your free year, it's just ₹500/month. That's it—no hidden fees, no transaction costs from us, no surprises. And you can cancel anytime.",
          },
        },
        {
          '@type': 'Question',
          name: 'Are there transaction fees or payment processing fees?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "You'll pay standard payment processing fees (around 2% for UPI, 2-3% for cards). But unlike other platforms, Tesserix doesn't take an extra cut. Your money is your money.",
          },
        },
        {
          '@type': 'Question',
          name: 'What if I decide this isn\'t for me?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cancel anytime, no questions asked. You can even export all your data—products, customers, orders—and take it with you.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many products can I add?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "As many as you want. Unlimited products, unlimited photos, unlimited everything. We're not in the business of nickel-and-diming you.",
          },
        },
        {
          '@type': 'Question',
          name: 'I already have a store on Shopify. Can I switch?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Yes, and it's easier than you might think. We can import your products and customer data automatically. Most stores are fully migrated within a day.",
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to hire a developer to set this up?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Not at all. You can set up your entire store yourself—customize the design, add products, configure payments—all without writing a single line of code. Save the ₹50,000+ you'd spend on a developer.",
          },
        },
        {
          '@type': 'Question',
          name: 'What if I get stuck or need help?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Just reach out. Our support team is made up of real people who actually want to help you succeed. Average response time is under 4 hours.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sourceSerif.variable} ${sourceSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans">
        <PostHogProvider>
          <ErrorBoundary>
            {children}
            <Toaster position="top-right" richColors />
          </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  );
}
