import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use the canonical production domain.
  const baseUrl = 'https://packwise-indol.vercel.app'
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  return {
    rules: {
      userAgent: '*',
      // Allow indexing of public-facing marketing and authentication pages
      allow: ['/', '/login', '/claim/'],
      // Prevent crawlers from indexing private user data and API routes to save crawl budget and protect privacy
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/', '/api/'],
    },
    // Explicitly point to the dynamically generated sitemap for improved discoverability
    sitemap: `${url}/sitemap.xml`,
  }
}
