import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// A sitemap.xml file ensures search engines can efficiently discover all public,
// indexable pages. By explicitly listing static public routes (like the homepage and login),
// we improve their crawlability. Private routes are deliberately excluded.
// Static dates are used for lastModified instead of new Date() to avoid inaccurately
// signaling constant content changes to crawlers.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      url: `${baseUrl}/`,
      lastModified: '2024-05-01',
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: '2024-05-01',
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
