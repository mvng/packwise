import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// This robots.ts configuration controls which parts of the Packwise site search engine crawlers are allowed to access.
// We explicitly allow the public landing page (`/`) and login page (`/login`) to be crawled for indexation.
// We block all private authenticated routes (`/dashboard`, `/settings`, `/inventory`, `/luggage`) and user-specific shared trip pages (`/trip/`) to prevent leaking sensitive information to search engines.
// This prevents search engines from indexing pages meant only for logged-in users and conserves crawl budget.

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/claim/'],
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/',
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
