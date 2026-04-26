import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Creating a dynamic robots.txt file to control search engine crawl scope.
// - Allows crawling of public landing pages (/) and authentication pages (/login).
// - Explicitly disallows crawling of private authenticated routes (/dashboard, /settings, /inventory, /luggage) to prevent indexing of user-specific data or redirect loops.
// - Explicitly disallows crawling of user-specific shared trip pages (/trip/*) to protect user privacy and avoid duplicate thin-content indexing if claims are empty.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  // Safely trim trailing slash if it exists
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/trip/', // Prevent crawling of dynamic trip pages e.g. /trip/[id]
        '/api/',  // Prevent crawling of API endpoints
      ],
    },
    // Commented out until sitemap.ts is implemented to avoid broken sitemap links
    // sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
