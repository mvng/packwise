import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding an explicit robots.ts configuration helps search engine crawlers understand
// which areas of the application are public and which are private.
// By disallowing routes like /dashboard, /settings, and /auth, we preserve crawl budget
// for the public landing page and shared trips, while preventing crawlers from hitting
// authentication redirects or indexing user-specific content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/api/',
        '/auth/',
      ],
    },
  }
}
