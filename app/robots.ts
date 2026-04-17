import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use environment variable for the base URL, falling back to the production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // SEO Rationale: Explicitly disallow crawling of private and API routes.
      // This prevents search engines from indexing pages that require authentication,
      // avoiding duplicate or "thin" content indexing of login redirects,
      // and preserves crawl budget for the actual public-facing content.
      disallow: ['/dashboard/', '/settings/', '/inventory/', '/luggage/', '/api/', '/claim/'],
    },
    sitemap: `${cleanBaseUrl}/sitemap.xml`,
  }
}
