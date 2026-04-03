import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a sitemap explicitly declares to search engine crawlers which pages are available
// to be indexed, their relative priority, and their update frequency. This significantly
// improves discoverability for core static and public-facing pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
