import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Define base URL dynamically and remove any trailing slashes
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // - Allow crawling of public landing page and authentication entry points.
  // - Disallow crawling of all private, authenticated routes (/dashboard, /settings, /inventory, /luggage)
  //   to prevent search engines from attempting to index user-specific data or getting stuck in auth loops.
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
