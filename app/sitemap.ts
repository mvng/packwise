import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  // SEO Rationale: We only include public static routes in the sitemap to ensure search engines
  // focus their crawl budget on discoverable marketing pages. Private pages (like /dashboard or /trip)
  // are excluded because they require authentication or are user-specific.
  // Note: We avoid using `lastModified: new Date()` for static routes as it inaccurately signals
  // constant updates to crawlers.
  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
