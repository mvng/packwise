import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Safe extraction of the base URL to prevent double slashes
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // - Prioritize the root homepage (`/`) for search engines, as it's the main landing page and entry point.
  // - Include the `/login` page so users searching for "packwise login" can find it easily.
  // - We intentionally omit `lastModified` because these are static pages that do not change frequently;
  //   faking a recent timestamp is an anti-pattern.
  // - We exclude dynamic shared pages (e.g. claim pages) and private routes as they provide no value to general search index.
  return [
    {
      url: `${baseUrl}`,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
