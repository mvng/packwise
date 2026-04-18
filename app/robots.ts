import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      // Allow crawlers to index public pages like the homepage and login
      userAgent: '*',
      allow: '/',
      // Prevent crawlers from indexing private, authenticated routes to protect user data and avoid thin content penalties
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
