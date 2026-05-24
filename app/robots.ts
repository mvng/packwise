import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // SEO Rationale: Explicitly define crawl rules to ensure search engines
  // index public landing pages while preventing them from crawling private
  // user routes and backend APIs, saving crawl budget and improving security.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/',
        '/api/',
      ],
    },
    sitemap: 'https://packwise-indol.vercel.app/sitemap.xml',
  }
}
