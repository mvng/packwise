import { MetadataRoute } from 'next'

/**
 * SEO Rationale:
 * A robots.txt file is necessary to guide search engine crawlers, optimizing crawl budget.
 * We explicitly allow crawling for public-facing routes (`/`, `/login`, shared `/trip/` pages).
 * We aggressively block crawling for private, authenticated routes (e.g., `/dashboard`, `/settings`)
 * to prevent search engines from attempting to index content that is inaccessible without a session,
 * thereby focusing their crawling efforts on publicly valuable content.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/trip/'],
      disallow: ['/dashboard/', '/settings/', '/inventory/', '/luggage/', '/claim/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
