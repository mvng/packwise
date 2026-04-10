import { MetadataRoute } from 'next'

/**
 * SEO Rationale:
 * A sitemap.xml file is crucial for search engine discoverability.
 * By explicitly listing the application's public, static routes (`/`, `/login`),
 * we ensure crawlers can efficiently find and index our primary entry points,
 * leading to better visibility. We avoid using `lastModified: new Date()` as
 * that is an anti-pattern that misleads crawlers for static pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

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
