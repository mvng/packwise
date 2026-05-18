import { MetadataRoute } from 'next'

// SEO Rationale:
// A sitemap.xml file helps search engines discover and index the public-facing pages of the site more efficiently.
// This file natively generates the sitemap using Next.js Metadata APIs for the landing page and login page,
// prioritizing the homepage with a higher priority and more frequent change frequency.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://packwise-indol.vercel.app'
  const lastModified = new Date()

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
