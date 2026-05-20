import { MetadataRoute } from 'next'

// Scout: Generate a dynamic sitemap.xml to improve crawlability for search engines.
// This ensures that the primary entry points to the application are discovered
// efficiently and prioritized appropriately.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
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
