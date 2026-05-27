import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/claim/'],
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
