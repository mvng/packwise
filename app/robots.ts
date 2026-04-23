import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // SEO Rationale:
  // We allow crawlers to index public marketing pages like the homepage and login page
  // to ensure maximum search visibility.
  // We deliberately exclude private, authenticated routes (dashboard, settings, inventory, luggage)
  // to prevent sensitive user data from being indexed and to optimize crawl budget on public pages.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
