import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding robots.ts generates a robots.txt file that guides search engine crawlers.
// It allows indexing of public landing pages (/, /login) while explicitly disallowing
// private, authenticated routes (/dashboard, /settings, /inventory, /luggage) and
// user-specific shared trip pages (/trip/). This prevents search engines from
// indexing sensitive user data and hitting auth redirects.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
