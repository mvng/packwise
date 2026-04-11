import { MetadataRoute } from 'next';

/**
 * SEO Rationale:
 * A robots.txt file is essential for guiding search engine crawlers on which pages to index.
 * We allow crawling of the root/public pages while explicitly disallowing private,
 * authenticated routes (like dashboard, settings, etc.) to prevent sensitive content
 * from being indexed and to optimize crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  // Ensure the baseUrl doesn't end with a slash to avoid double slashes when concatenating
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/settings',
        '/inventory',
        '/luggage',
        '/claim/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
