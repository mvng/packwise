import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Implementing a dynamic sitemap.xml ensures search engines can efficiently
// discover and index our core public pages. We prioritize the homepage
// for frequent crawling. Private pages are deliberately excluded to focus
// crawl budget on high-value public content.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

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
