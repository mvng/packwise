import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Define base URL, handling dynamic environments and trimming trailing slashes safely.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      // SEO Rationale: Allow search crawlers to index public-facing landing and auth pages
      allow: ['/', '/login'],
      // SEO Rationale: Prevent search crawlers from accessing private, authenticated routes to save crawl budget and protect user privacy
      disallow: ['/dashboard/', '/settings/', '/inventory/', '/luggage/'],
    },
    // SEO Rationale: Provide the location of the sitemap to help search engines discover allowed pages efficiently
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
