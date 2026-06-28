import { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Adding page-specific canonical URLs prevents Next.js from merging static
// canonicals down to all child pages, ensuring correct indexing and og:url generation.
export const metadata: Metadata = {
  title: 'Sign In or Create Account | Packwise',
  description: 'Log in to your Packwise account to view and manage your smart packing lists, or create a new account to get started.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In or Create Account | Packwise',
    description: 'Log in to your Packwise account to view and manage your smart packing lists, or create a new account to get started.',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
