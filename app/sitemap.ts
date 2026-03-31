import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Generating a sitemap is critical for signaling high-value, indexable pages to search engines.
// This sitemap exclusively points crawlers toward public, static landing pages (/ and /login)
// and entirely omits private authenticated routes, ensuring search engines index exactly what
// new users are meant to discover, thus improving overall crawlability and discoverability.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

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
