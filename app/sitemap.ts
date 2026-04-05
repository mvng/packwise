import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a sitemap.xml ensures search engines can easily discover and index the public
// pages of Packwise. We omit protected routes (like /dashboard, /inventory, /settings)
// and dynamic, unlisted routes (like /claim/[token]) because they require authentication
// or are meant for direct sharing, preventing search engine crawlers from accessing them anyway.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

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
    {
      url: `${baseUrl}/ds`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
