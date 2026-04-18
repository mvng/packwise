import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return [
    {
      // The homepage is the primary landing page, prioritized for indexing
      url: `${baseUrl}/`,
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      // The login page is public but less priority than homepage
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    // Note: Private routes (/dashboard, /settings, etc.) and dynamic shared trips (/trip/[id])
    // are deliberately excluded from this static sitemap as they are either user-specific or dynamic
  ]
}
