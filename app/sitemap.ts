import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Creating a dynamic sitemap improves crawlability for search engines.
// We explicitly only include public routes ('/' and '/login') to conserve
// crawl budget and avoid submitting authenticated or private user routes
// (like dashboard, settings, or shared trip lists) for indexing.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  // Ensure the base URL doesn't have a trailing slash to avoid double slashes in output URLs
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}/`,
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
