import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // SEO Rationale: Provide a structured sitemap.xml to help search engine
  // crawlers discover static, public-facing routes more efficiently.
  return [
    {
      url: 'https://packwise-indol.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://packwise-indol.vercel.app/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
