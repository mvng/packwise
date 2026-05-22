import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use environment variable if available, otherwise fallback to known production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      // Allow indexing of public-facing landing and auth pages for better search visibility
      allow: ['/', '/login', '/claim/'],
      // Prevent crawlers from indexing private authenticated application views to protect user data
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
