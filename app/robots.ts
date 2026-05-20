import { MetadataRoute } from 'next'

// Scout: Configure crawl scope to ensure search engines only index public-facing pages.
// We explicitly disallow private routes (dashboard, settings, etc.) to prevent duplicate content
// or attempting to crawl login-walled areas.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/claim/'],
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
