import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO improvement: Added robots.txt configuration to explicitly control crawl scope
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
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
