import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a dynamic sitemap.xml ensures search engines can easily discover and crawl
// the public-facing pages of Packwise (`/` and `/login`). We explicitly prioritize the homepage
// with a higher weight (1.0) compared to the login page (0.8). Private authenticated routes
// and user-specific shared pages are intentionally excluded from this sitemap to prevent
// them from being indexed and cluttering search results with inaccessible or private content.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
