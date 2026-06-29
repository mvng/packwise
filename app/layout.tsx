import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// SCOUT SEO RATIONALE:
// Removing the hardcoded `url` property from the `openGraph` object. By doing this,
// child pages will no longer incorrectly inherit the homepage's specific Open Graph URL.
// Instead, Next.js will automatically generate the correct `og:url` for each page
// by combining the `metadataBase` defined here with the page-specific canonical URL.
export const metadata: Metadata = {
  metadataBase: new URL('https://packwise-indol.vercel.app'),
  title: 'Packwise – Smart Packing Lists',
  description: 'Create smart packing lists for every trip. Organize by category, track what you have packed, and never forget an item again.',
  keywords: ['packing', 'travel', 'packing list', 'trip planner', 'vacation packing', 'travel checklist', 'luggage planner'],
  openGraph: {
    title: 'Packwise – Smart Packing Lists',
    description: 'Create smart packing lists for every trip.',
    type: 'website',
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
