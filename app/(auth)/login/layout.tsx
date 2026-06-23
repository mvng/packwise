import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In or Create Account | Packwise',
  description: 'Log in to your Packwise account to view and manage your smart packing lists, or create a new account to get started.',
  openGraph: {
    title: 'Sign In or Create Account | Packwise',
    description: 'Log in to your Packwise account to view and manage your smart packing lists, or create a new account to get started.',
  },
  // SCOUT SEO RATIONALE:
  // Adding a canonical URL directly to the login page prevents duplicate indexing if the page
  // is accessed via varying query parameters (e.g., ?error=unauthorized).
  alternates: {
    canonical: 'https://packwise-indol.vercel.app/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
