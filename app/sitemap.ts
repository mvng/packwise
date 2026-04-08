import { MetadataRoute } from 'next'

// SEO Rationale: Providing a dynamic sitemap helps search engine crawlers discover and index public pages efficiently.
// It prioritizes critical landing pages while omitting private routes that shouldn't be indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return [
    {
      url: `${baseUrl}`,
      changeFrequency: 'weekly',
      priority: 1, // High priority for homepage
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8, // Secondary priority for auth pages
    },
  ]
}
