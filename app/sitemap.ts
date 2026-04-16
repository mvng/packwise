import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Define base URL dynamically and remove any trailing slashes
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // - Provide search engines with a sitemap to discover public static pages.
  // - Exclude private pages.
  // - Do not use dynamic `lastModified: new Date()` as this misleads search engines
  //   into thinking static content changes constantly.
  // - Priority is given to the main landing page.
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
