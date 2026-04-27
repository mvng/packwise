import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// This sitemap.ts configuration helps search engine crawlers discover the public pages of the Packwise site.
// We only include public-facing routes (`/` and `/login`) that should be indexed by search engines.
// Private routes are intentionally excluded from the sitemap.
// We avoid using `lastModified: new Date()` as it is an anti-pattern that inaccurately tells search engines the content has changed upon every request/build.

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}`,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
