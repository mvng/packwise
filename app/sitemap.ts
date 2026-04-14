import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a dynamic sitemap.xml ensures search engines can efficiently discover
// all public-facing, indexable routes. This increases crawl efficiency.
// We explicitly exclude authenticated routes (e.g., /dashboard, /inventory)
// and dynamic private pages (e.g., /claim/[token]) to keep the crawl scope focused on landing pages.
// We also avoid using lastModified: new Date() as it is an anti-pattern for static routes
// that inaccurately tells crawlers content has updated on every single request.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}/`,
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
