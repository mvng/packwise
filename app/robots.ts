import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a robots.ts explicitly guides search engine crawlers away from authenticated
// or private application sections like /dashboard/, /settings/, etc.
// This preserves the "crawl budget" for public-facing, indexable pages like the homepage
// or shared trips (/claim/), preventing crawlers from wasting resources on pages
// they will eventually be blocked from seeing by authentication redirects anyway.
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
    // We omit sitemap here as we haven't created one yet, but if one existed it would go here.
  }
}
