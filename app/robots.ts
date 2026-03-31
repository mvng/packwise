import type { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a dynamic robots.txt file explicitly guides search engine crawlers away from
// private, authenticated areas of the application (e.g., /dashboard, /settings, /trip).
// This prevents crawlers from hitting redirect loops or error pages, thereby optimizing
// crawl budget and focusing search indexing exclusively on public-facing landing pages
// like the home page (/) and the /login page.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard',
        '/settings',
        '/trip',
        '/inventory',
        '/luggage',
        '/claim',
        '/api/',
        '/_next/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
