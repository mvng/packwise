import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app';
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  // SEO Rationale: We allow crawling of the main public pages to maximize visibility,
  // but explicitly disallow indexing of private authenticated routes (/dashboard, /settings, /inventory, /luggage)
  // and user-specific shared pages (/trip/) to protect user privacy and prevent index bloat with unhelpful pages.
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/settings', '/inventory', '/luggage', '/trip/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
