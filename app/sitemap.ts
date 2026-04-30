import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // SCOUT SEO RATIONALE:
  // Generating a sitemap.xml to help search engines easily discover our public pages.
  // We only include the static public routes (/ and /login) which are relevant for indexing.
  // We use a fixed lastModified date for static pages instead of `new Date()`
  // to prevent falsely signaling content changes on every build/request,
  // which is an SEO anti-pattern that can dilute crawl budget.

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date('2024-05-01T00:00:00.000Z'), // Fixed date for static content
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date('2024-05-01T00:00:00.000Z'), // Fixed date for static content
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
