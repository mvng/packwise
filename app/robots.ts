import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// The robots.txt explicitly allows crawling of our public marketing and authentication pages,
// but explicitly disallows private, authenticated routes (like dashboard, settings, inventory, luggage)
// and user-specific shared paths (like /trip/). This ensures search engines do not waste crawl
// budget on pages they cannot access and prevents accidental indexing of user data if a route
// handles unauthenticated access incorrectly.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  // Ensure the base URL doesn't have a trailing slash to avoid double slashes in output URLs
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
