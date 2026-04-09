import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Ensure we always have an absolute URL for crawlers, falling back to prod if env is missing
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return [
    {
      // The homepage is the primary entry point for discovery and should be crawled most frequently
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // The login page is public but changes less frequently and is slightly lower priority than the homepage
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
