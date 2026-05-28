import { MetadataRoute } from 'next'

// Defines the crawler rules for the site to ensure private pages are not indexed
export default function robots(): MetadataRoute.Robots {
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
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
