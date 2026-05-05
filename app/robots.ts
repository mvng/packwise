import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // - Public routes like / and /login are allowed for indexing.
  // - Private authenticated routes (/dashboard, /settings, /inventory, /luggage) and user-specific shared trips (/trip/) are disallowed to prevent exposing private data and conserve crawl budget.
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
