import { MetadataRoute } from 'next';

// SEO Rationale: A dynamic sitemap.xml helps search engines (like Google) discover and index the most important
// static pages more efficiently. It signals which pages are core to the application.
// We include '/' (landing page) and '/login' to ensure maximum visibility for user acquisition.
// Private dynamic routes are deliberately excluded to prevent crawler noise.
export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1, // Homepage gets highest priority
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ];
}
