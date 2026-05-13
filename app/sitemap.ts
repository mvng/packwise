import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // 🔍 SEO rationale: Explicitly listing public routes like / and /login helps search
  // engines discover these entry points quickly and assign appropriate crawl priority.
  // Private routes are intentionally excluded from the sitemap.
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
  ]
}
