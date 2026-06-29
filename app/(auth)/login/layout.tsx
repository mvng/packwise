import { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Adding a canonical tag specifically for the login page prevents duplicate content issues
// if the page is accessed via query parameters (e.g. tracking codes) and helps Next.js
// accurately construct the `og:url` without incorrectly inheriting the homepage's URL.
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
