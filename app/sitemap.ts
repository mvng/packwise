import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding sitemap.ts generates a sitemap.xml file, improving crawlability by
// explicitly providing search engines with a list of the application's public routes.
// Private routes and dynamic user-content pages are omitted.
// Note: We avoid using dynamic `lastModified: new Date()` as it inaccurately tells
// search engines the content changes on every request/build for static pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
