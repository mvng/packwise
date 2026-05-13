import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Use the same base URL as configured in layout.tsx or an environment variable.
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

  // 🔍 SEO rationale: Explicitly block crawlers from indexing private, authenticated
  // routes and user-specific shared trip pages to prevent thin/duplicate content
  // and protect privacy. Allow crawling on all other public routes.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/inventory/',
        '/luggage/',
        '/trip/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
