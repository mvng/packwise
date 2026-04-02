import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a sitemap explicitly lists the public, indexable routes of the application
// for search engine crawlers. We intentionally omit authenticated routes (like /dashboard)
// and private unlisted routes (like /claim/[token]) to ensure crawl budgets are spent
// only on pages that can actually appear in search results.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return [
    {
      url: baseUrl,
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
