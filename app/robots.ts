import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Safe extraction of the base URL to prevent double slashes
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // - Allow crawling of public-facing marketing pages (e.g. '/' and '/login')
  // - Explicitly exclude private, authenticated routes ('/dashboard', '/settings', etc.) to prevent sensitive content indexing and avoid crawler budget waste
  // - Exclude dynamic user-specific shared routes ('/trip/') as they aren't useful for generic search results
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
