import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// The robots.txt file guides search engine crawlers away from private, authenticated routes.
// This prevents crawlers from wasting crawl budget on pages they cannot access and avoids
// accidental indexing of sensitive user-specific URL paths.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/trip/',
        '/luggage/',
        '/inventory/',
        '/claim/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
