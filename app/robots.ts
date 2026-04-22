import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use NEXT_PUBLIC_APP_URL for local/staging, fallback to production URL
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SCOUT SEO RATIONALE:
  // We allow crawlers on public routes like the homepage (/) and login (/login).
  // We disallow crawling on private, authenticated routes (/dashboard, /settings, /inventory, /luggage)
  // to save crawl budget and prevent search engines from trying to index pages that redirect to login.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
