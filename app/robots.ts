import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Define base URL safely, trimming any trailing slashes to prevent double-slash issues.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      // SEO Rationale: We allow crawlers to access the public landing page and login page
      // to ensure our brand presence and primary entry points are indexed.
      allow: ['/', '/login'],
      // SEO Rationale: We explicitly disallow private authenticated routes and user-specific
      // shared trip pages to optimize crawl budget. This prevents search engines from
      // wasting time attempting to crawl pages that require authentication or are private,
      // avoiding duplicate or thin content penalties.
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
