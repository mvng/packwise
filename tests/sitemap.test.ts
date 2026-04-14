import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'

test.describe('sitemap', () => {
  test('returns the correct sitemap structure for public routes', () => {
    // Determine the base URL dynamically just like the implementation does
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
    const expectedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

    const result = sitemap()

    expect(result).toHaveLength(2)

    // Check root route
    expect(result[0]).toEqual({
      url: `${expectedBaseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1,
    })

    // Check login route
    expect(result[1]).toEqual({
      url: `${expectedBaseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })

    // Explicitly verify lastModified is not present to adhere to SEO learnings
    expect(result[0].lastModified).toBeUndefined()
    expect(result[1].lastModified).toBeUndefined()
  })
})
