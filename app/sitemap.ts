import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the canonical production domain.
  const baseUrl = 'https://packwise-indol.vercel.app'
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  return [
    {
      // The homepage is the primary entry point and deserves the highest crawl priority
      url: `${url}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // The login page is a secondary public entry point
      url: `${url}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
