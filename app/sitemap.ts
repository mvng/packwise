import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Get base URL and safely trim any trailing slash
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // - Add public, indexable routes to the sitemap to ensure search engines can discover them.
  // - We prioritize the landing page (1.0) and include the login page (0.8).
  // - We deliberately exclude authenticated routes (/dashboard, etc.) and omit lastModified
  //   for static routes as an SEO best practice to prevent misleading crawlers.
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
