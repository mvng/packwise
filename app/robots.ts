import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // SCOUT SEO RATIONALE:
  // We explicitly define crawling rules to optimize the crawl budget and prevent
  // search engines from indexing private or user-specific pages.
  // Public routes (/, /login) are allowed.
  // Authenticated app routes (/dashboard, /settings, /inventory, /luggage) and
  // user-specific shared trip pages (/trip/) are disallowed to protect privacy
  // and prevent index bloat from thin or inaccessible pages.

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/',
        '/api/' // typically we disallow api routes as well
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
