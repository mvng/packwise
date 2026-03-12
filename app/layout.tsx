import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// TODO: Import Vercel Analytics here
// import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    metadataBase: new URL('https://packwise-indol.vercel.app'),
  title: 'Packwise – Smart Packing Lists',
  description: 'Create smart packing lists for every trip. Organize by category, track what you have packed, and never forget an item again.',
  keywords: ['packing', 'travel', 'packing list', 'trip planner'],
  openGraph: {
    title: 'Packwise – Smart Packing Lists',
    description: 'Create smart packing lists for every trip.',
    type: 'website',
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
        {/* TODO: Render Vercel Analytics component here */}
        {/* <Analytics /> */}
        <SpeedInsights />
      </body>
    </html>
  )
}
