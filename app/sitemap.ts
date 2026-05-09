import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // SCOUT SEO RATIONALE:
  // A sitemap provides search engines with a roadmap of our application's indexable pages,
  // ensuring comprehensive crawling and better representation in search results.
  // We prioritize the homepage (priority: 1) as the main landing and entry point.
  // The login page is included (priority: 0.8) to capture intent-driven searches.
  // Private pages and dynamic user-specific trip pages are excluded from the sitemap
  // as they are disallowed in robots.txt and should not be crawled or indexed.

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
