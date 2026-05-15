import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Explicitly generating a robots.txt prevents search engines from crawling
// authenticated or private user routes (like /dashboard or /trip/)
// while allowing them to index public landing pages.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
