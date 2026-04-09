import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use absolute URL for the sitemap reference as required by SEO best practices
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      // Allow all crawlers by default
      userAgent: '*',
      // Explicitly allow root paths
      allow: '/',
      // Prevent crawlers from indexing private, authenticated user routes to optimize crawl budget
      disallow: ['/dashboard/', '/settings/', '/inventory/', '/luggage/'],
    },
    // Direct crawlers to the sitemap for better indexation of allowed routes
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
