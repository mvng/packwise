import { test, expect } from '@playwright/test'
import sitemap from '../app/sitemap'

test('sitemap generates correct public routes', () => {
  const result = sitemap()

  expect(result).toHaveLength(2)
  expect(result[0].url).toMatch(/\/$/)
  expect(result[1].url).toMatch(/\/login$/)
  expect(result[0].priority).toBe(1)
  expect(result[1].priority).toBe(0.8)
})