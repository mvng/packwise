import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // We prioritize the home page (priority 1.0) as it's the primary landing page for the application.
  // The login page is included (priority 0.8) for brand discovery.
  // We avoid using `lastModified: new Date()` for static routes as it inaccurately signals content churn.
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
