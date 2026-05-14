import { MetadataRoute } from 'next'

// SEO Rationale: A robots.txt file directs search engine crawlers on which pages they can or cannot index.
// By explicitly disallowing private authenticated routes (/dashboard, /settings, etc.), we prevent search engines
// from wasting crawl budget on inaccessible pages, and focus their attention on our public landing pages.
export default function robots(): MetadataRoute.Robots {
  // Ensure trailing slash is safely trimmed from the base URL if it exists
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
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
