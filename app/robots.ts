import { MetadataRoute } from 'next'

// SEO Rationale:
// A robots.txt file provides instructions to web crawlers about which parts of the site they should or should not index.
// By explicitly allowing public pages and disallowing private authenticated routes (like dashboard, settings, etc.),
// we optimize crawl budget and prevent sensitive or user-specific pages from appearing in search results.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/claim/'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
