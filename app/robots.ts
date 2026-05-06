import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a dynamic robots.txt directs search engine crawlers on which pages to index.
// We allow crawling of public landing and authentication pages (`/` and `/login`) to ensure
// they appear in search results. Conversely, we explicitly disallow crawling of private routes
// (`/dashboard`, `/settings`, `/inventory`, `/luggage`) and user-specific shared paths (`/trip/`)
// to preserve data privacy, prevent duplicate content penalties, and optimize crawl budget.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://packwise-indol.vercel.app'
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
