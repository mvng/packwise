import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
