import type { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// Adding a robots.ts file allows us to explicitly guide search engine crawlers away from
// authenticated and private application sections. This prevents crawlers from wasting crawl
// budget on non-public pages (which would 404 or redirect anyway) and avoids any potential
// duplicate content issues. We use Next.js's MetadataRoute.Robots to generate this dynamically.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/api/',
        '/trip/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
