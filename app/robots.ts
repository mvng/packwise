import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/trip', '/inventory', '/luggage'],
    },
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
