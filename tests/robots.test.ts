import { test, expect } from '@playwright/test'
import robots from '../app/robots'

test('robots generates correct rules and sitemap', () => {
  const result = robots()

  // Verify rules
  const rules = result.rules
  expect(rules).not.toBeNull()

  if (Array.isArray(rules)) {
    const rule = rules[0]
    expect(rule.userAgent).toBe('*')
    expect(rule.allow).toContain('/')
    expect(rule.allow).toContain('/login')
    expect(rule.disallow).toContain('/api/')
    expect(rule.disallow).toContain('/dashboard/')
  } else {
    expect(rules!.userAgent).toBe('*')
    expect(rules!.allow).toContain('/')
    expect(rules!.allow).toContain('/login')
    expect(rules!.disallow).toContain('/api/')
    expect(rules!.disallow).toContain('/dashboard/')
  }

  // Verify sitemap
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://packwise-indol.vercel.app'
  expect(result.sitemap).toBe(`${baseUrl}/sitemap.xml`)
})
