import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a sitemap ensures that search engine crawlers can efficiently
// discover all public-facing routes, improving the indexability of the application.
// We only include public static routes like the home and login pages. Dynamic
// routes like /claim/[token] are omitted to keep them relatively private until
// they are explicitly shared via links.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://packwise-indol.vercel.app'

  return [
    {
      url: baseUrl,
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
