import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // SCOUT SEO RATIONALE:
  // Defining a robots.txt provides clear instructions to web crawlers about which
  // pages to index and which to ignore. We want search engines to crawl public marketing
  // and login pages to improve discoverability. However, we explicitly disallow crawling
  // of private authenticated user routes (/dashboard, /settings, /inventory, /luggage) and
  // user-specific shared trip pages (/trip/) to prevent sensitive data indexing and avoid
  // indexing a large number of low-value, duplicate-content pages which can dilute crawl budget.

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
