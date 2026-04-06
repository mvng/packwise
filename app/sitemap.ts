import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a sitemap.xml helps search engines (Google, Bing) discover, crawl, and index
// the public-facing pages of the application more efficiently. By omitting private routes
// (e.g. /dashboard, /settings), we focus crawl budget entirely on pages that can actually
// rank in search results, preventing crawler waste.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

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
