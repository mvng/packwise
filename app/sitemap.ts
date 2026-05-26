import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a sitemap.xml ensures search engines can efficiently discover and index
// the primary public pages of the application (Home and Login).
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://packwise-indol.vercel.app'

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
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
