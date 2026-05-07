import { MetadataRoute } from 'next'

// SCOUT SEO RATIONALE:
// This robots.txt explicitly controls crawler access. We allow crawling of
// public pages (/ and /login) to ensure they are discoverable in search results.
// We explicitly disallow private authenticated routes (/dashboard, /settings,
// /inventory, /luggage) and user-specific shared pages (/trip/, /claim/)
// to prevent sensitive user data from being indexed and avoid "thin content" penalties.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
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
        '/trip/',
        '/claim/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
