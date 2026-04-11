import { MetadataRoute } from 'next';

/**
 * SEO Rationale:
 * An XML sitemap helps search engines discover and index public pages more efficiently.
 * Here we list our primary public static routes (`/` and `/login`) with their respective priorities.
 * We avoid using `lastModified: new Date()` as an anti-pattern for static routes,
 * which falsely tells search engines the content has changed on every request.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  // Ensure the baseUrl doesn't end with a slash to avoid double slashes when concatenating
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return [
    {
      url: baseUrl,
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ];
}
