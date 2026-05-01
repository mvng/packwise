import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// A robots.txt file is essential to guide search engine crawlers.
// It allows crawlers to access public pages like the homepage and login,
// but explicitly prevents them from indexing private, authenticated routes
// (/dashboard, /settings, /inventory, /luggage) and user-specific trips (/trip/),
// preventing index bloat and protecting user privacy.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
