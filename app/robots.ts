import type { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// The robots.txt file guides search engine crawlers on which parts of the site they should and should not crawl.
// We are explicitly disallowing private authenticated routes (/dashboard, /settings, /inventory, /luggage) and
// user-specific shared trip pages (/trip/). This prevents indexation of sensitive or non-public content and
// optimizes crawl efficiency for the public routes (like '/' and '/login') by preserving crawl budget.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard/', '/settings/', '/inventory/', '/luggage/', '/trip/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
