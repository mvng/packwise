import type { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a sitemap.xml explicitly defines the public URL structure of the application.
// We only include the landing page ('/') and the login page ('/login') because all other
// pages (dashboard, settings, inventory, luggage, trip details) are private or user-specific.
// This prevents search crawlers from wasting crawl budget on authenticated routes that they
// cannot access and ensures only indexable public content is discovered.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
