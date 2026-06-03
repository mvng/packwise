import { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Defining relative `alternates.canonical` and `openGraph.url` locally ensures
// proper canonical resolution and distinct Open Graph previews for the login route.
export const metadata: Metadata = {
  alternates: {
    canonical: '/login',
  },
  title: 'Sign In or Create Account | Packwise',
  description: 'Log in to your Packwise account to view and manage your smart packing lists, or create a new account to get started.',
  openGraph: {
    url: '/login',
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
