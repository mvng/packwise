import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a robots.txt helps crawlers understand which pages to index and which to ignore.
// We explicitly disallow private authenticated routes and backend APIs to prevent search engines
// from indexing user-specific data or trying to crawl non-public pages, optimizing crawl budget.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/claim/'],
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
        '/api/'
      ],
    },
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
