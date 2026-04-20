import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Get base URL and safely trim any trailing slash to prevent double slash errors in paths
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // - Allow public pages like /, /login, and shared /trip/[id] routes to be indexed
  //   since they contain shareable public value or act as landing pages.
  // - Disallow private, authenticated-only routes (/dashboard, /settings, /inventory, /luggage)
  //   to prevent search engines from crawling inaccessible pages, optimizing crawl budget.
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/trip/'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
