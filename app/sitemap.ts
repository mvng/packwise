import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://packwise-indol.vercel.app'

  // We are currently only exposing the main public marketing and auth pages.
  // Dynamic claim pages are intentionally left out of the sitemap.xml because
  // they are ephemeral/unique to users, but they remain crawlable if linked.
  return [
    {
      url: `${baseUrl}/`,
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
