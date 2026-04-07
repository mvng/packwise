import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'

test('sitemap generates correct URLs', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  const result = sitemap()
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBe(2)
  expect(result[0].url).toContain(baseUrl)
  expect(result[1].url).toContain(`${baseUrl}/login`)
})
