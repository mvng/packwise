import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://packwise-indol.vercel.app'),
  title: 'Packwise – Smart Packing Lists',
  description: 'Create smart packing lists for every trip. Organize by category, track what you have packed, and never forget an item again.',
  keywords: ['packing', 'travel', 'packing list', 'trip planner', 'vacation packing', 'travel checklist', 'luggage planner'],
  openGraph: {
    title: 'Packwise – Smart Packing Lists',
    description: 'Create smart packing lists for every trip.',
    type: 'website',
    // SCOUT SEO RATIONALE:
    // Removed hardcoded `url` from global openGraph metadata.
    // In Next.js App Router, hardcoding this here causes all child pages
    // to incorrectly inherit the homepage's Open Graph URL for social sharing.
    // Instead, Next.js will automatically populate og:url for every page based
    // on `metadataBase` combined with page-specific `alternates: { canonical: ... }`.
    siteName: 'Packwise',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packwise – Smart Packing Lists',
    description: 'Create smart packing lists for every trip. Organize by category, track what you have packed, and never forget an item again.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
