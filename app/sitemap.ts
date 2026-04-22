import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use NEXT_PUBLIC_APP_URL for local/staging, fallback to production URL
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // We only include static public routes like the homepage (/) and login (/login).
  // Dynamic shared trips are not included to prevent creating massively large sitemaps
  // for user-generated content that may be private or ephemeral.
  // We also use a fixed lastModified date to avoid the anti-pattern of updating it on every request.
  const fixedDate = new Date('2024-04-22')

  return [
    {
      url: `${baseUrl}`,
      lastModified: fixedDate,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: fixedDate,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
