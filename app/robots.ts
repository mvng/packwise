import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Explicitly guiding search engine crawlers away from authenticated or private
// application sections (e.g. /dashboard, /settings, /inventory) prevents them
// from wasting crawl budget on inaccessible pages, and ensures only public-facing
// routes (like the homepage and shared claim pages) are indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/claim/'],
      disallow: [
        '/dashboard/',
        '/inventory/',
        '/luggage/',
        '/settings/',
        '/trip/',
        '/api/',
      ],
    },
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
