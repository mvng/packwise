import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'], // All public paths are allowed by default
      disallow: [
        // SCOUT SEO RATIONALE:
        // Disallow crawling of private authenticated routes and APIs.
        // This preserves crawl budget and ensures search engines focus
        // entirely on public-facing pages (home, login, shared claim pages).
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
        '/api/'
      ],
    },
    // If you add a sitemap later, include the URL here:
    // sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
