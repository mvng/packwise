import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // SEO Rationale: Dynamically determine the base URL to prevent crawler issues across environments.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return [
    {
      // SEO Rationale: The homepage is the primary entry point and gets the highest priority.
      // We omit dynamic lastModified to avoid falsely signaling continuous changes.
      url: `${baseUrl}`,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // SEO Rationale: The login page is included as it is public, but with a lower priority.
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // SEO Rationale: Private authenticated routes (/dashboard, /settings, etc.) are excluded here
    // as well as in robots.ts to prevent them from being crawled or indexed.
    // Public shared trips (/trip/[id]) are omitted since they are dynamically generated
    // and we don't list all user trips globally for privacy and scale reasons.
  ];
}
