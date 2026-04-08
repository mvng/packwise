import { MetadataRoute } from 'next'

// SEO Rationale: robots.txt guides search engine crawlers, ensuring they index valuable public pages
// while keeping them out of private or unhelpful paths (like dashboards or APIs), preventing crawl budget waste.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard/', '/claim/', '/api/'], // Protect private routes from crawling
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
