import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard',
        '/settings',
        '/trip/',
        '/inventory',
        '/luggage',
        '/api/',
        '/auth/',
        '/claim/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
