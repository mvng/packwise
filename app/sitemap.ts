import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Define base URL safely, trimming any trailing slashes to prevent double-slash issues.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale: We only include public, static pages in the sitemap.
  // Private routes (dashboard, inventory, etc.) and dynamic user trips are excluded
  // because they are not meant to be indexed by search engines.
  //
  // NOTE: We avoid using `lastModified: new Date()` because it is an anti-pattern.
  // It inaccurately tells search engines the static content has changed upon every
  // request or build, which can lead to inefficient crawling.
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
