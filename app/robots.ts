import { MetadataRoute } from 'next';

// SEO Rationale: A dynamically generated robots.txt file controls crawler access and prevents
// search engines from indexing private, authenticated, or sensitive routes (like /dashboard or /settings).
// This preserves the "crawl budget" for valuable public-facing content.
export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Prevent crawlers from accessing private or dynamic application state routes
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/claim/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`, // Point crawlers to the dynamically generated sitemap
  };
}
