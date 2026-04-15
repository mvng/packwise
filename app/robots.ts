import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // SEO Rationale: Dynamically determine the base URL to prevent crawler issues across environments.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return {
    rules: {
      // SEO Rationale: Allow general crawling but deliberately exclude private, authenticated routes.
      // This prevents search engines from indexing user-specific or sensitive pages, preserving crawl budget.
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/api/'
      ],
    },
    // SEO Rationale: Provide the sitemap URL to search engines for efficient crawling.
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
