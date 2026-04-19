import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Define base URL, handling dynamic environments and trimming trailing slashes safely.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale: Only index public pages. Private routes are omitted from the sitemap.
  // We avoid `lastModified: new Date()` as it is an anti-pattern that inaccurately tells search engines the content has changed upon every request.
  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1, // High priority for the main landing page
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8, // Important page, but less priority than home
    },
  ]
}
