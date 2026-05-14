import { MetadataRoute } from 'next'

// SEO Rationale: A sitemap.xml explicitly lists the URLs that are available for crawling, along with metadata like
// priority and last modification dates. This helps search engines discover our public pages faster and more reliably
// than relying solely on link traversal.
export default function sitemap(): MetadataRoute.Sitemap {
  // Ensure trailing slash is safely trimmed from the base URL if it exists
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
