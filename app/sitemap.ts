import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // SEO Rationale: Provide a dynamic sitemap for search engines to
  // efficiently discover and index the primary public routes.
  const baseUrl = 'https://packwise-indol.vercel.app'

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
