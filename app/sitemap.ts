import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // - We include public routes (/ and /login) to ensure search engine discovery.
  // - We deliberately exclude private routes to prevent indexing of restricted content.
  // - We avoid `lastModified: new Date()` for static routes to accurately reflect content freshness.
  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
