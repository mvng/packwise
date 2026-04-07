import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  // SEO Rationale: A robust robots.txt directs search crawlers toward the sitemap
  // while explicitly disallowing private or authenticated routes, preventing
  // duplicate content issues and preserving crawl budget.
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/api/', '/dashboard/', '/settings/', '/claim/', '/trip/', '/inventory/', '/luggage/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
