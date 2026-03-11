import { test, expect } from '@playwright/test'
import { getTripDuration, formatDateWithTimezone, formatDate } from '../lib/utils'

test.describe('getTripDuration', () => {
  test('should return 0 for same start and end dates', () => {
    const startDate = '2024-01-01'
    const endDate = '2024-01-01'
    expect(getTripDuration(startDate, endDate)).toBe(0)
  })

  test('should return 1 for a one-day trip', () => {
    const startDate = '2024-01-01'
    const endDate = '2024-01-02'
    expect(getTripDuration(startDate, endDate)).toBe(1)
  })

  test('should return 7 for a week-long trip', () => {
    const startDate = '2024-01-01'
    const endDate = '2024-01-08'
    expect(getTripDuration(startDate, endDate)).toBe(7)
  })

  test('should handle Date objects', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-01-05')
    expect(getTripDuration(startDate, endDate)).toBe(4)
  })

  test('should handle mixed string and Date objects', () => {
    const startDate = '2024-01-01'
    const endDate = new Date('2024-01-03')
    expect(getTripDuration(startDate, endDate)).toBe(2)
  })

  test('should return a negative number if end date is before start date', () => {
    const startDate = '2024-01-05'
    const endDate = '2024-01-01'
    // Math.ceil(-4) is -4
    expect(getTripDuration(startDate, endDate)).toBe(-4)
  })

  test('should handle partial days by rounding up', () => {
    const startDate = '2024-01-01T10:00:00Z'
    const endDate = '2024-01-02T12:00:00Z'
    // 1 day and 2 hours = 1.083 days. Math.ceil(1.083) = 2
    expect(getTripDuration(startDate, endDate)).toBe(2)
  })

  test('should handle same-day trips with different times', () => {
    const startDate = '2024-01-01T10:00:00Z'
    const endDate = '2024-01-01T22:00:00Z'
    // 12 hours = 0.5 days. Math.ceil(0.5) = 1
    expect(getTripDuration(startDate, endDate)).toBe(1)
  })
})

test.describe('formatDate', () => {
  test('should format YYYY-MM-DD string without timezone', () => {
    const date = '2024-01-01'
    const result = formatDate(date)
    expect(result).toBe('Jan 1, 2024')
  })

  test('should format YYYY-MM-DD string with timezone', () => {
    const date = '2024-01-01'
    const result = formatDate(date, { includeTimezone: true })
    expect(result).toMatch(/^Jan 1, 2024 [a-zA-Z0-9+\-:\s]+$/) // e.g., "Jan 1, 2024 GMT" or "Jan 1, 2024 EST"
  })

  test('should format Date object without timezone', () => {
    const date = new Date(2024, 0, 1) // Jan 1, 2024 local time
    const result = formatDate(date)
    expect(result).toBe('Jan 1, 2024')
  })

  test('should format Date object with timezone', () => {
    const date = new Date(2024, 0, 1) // Jan 1, 2024 local time
    const result = formatDate(date, { includeTimezone: true })
    expect(result).toMatch(/^Jan 1, 2024 [a-zA-Z0-9+\-:\s]+$/)
  })

  test('should format non-YYYY-MM-DD string properly', () => {
    // Tests the fallback parsing
    const date = 'Jan 1, 2024 12:00:00'
    const result = formatDate(date)
    expect(result).toBe('Jan 1, 2024')
  })
})

test.describe('formatDateWithTimezone', () => {
  test('should format date with valid timezone', () => {
    // By using a specific ISO time in UTC, we can predict the timezone shift
    // Midnight UTC on Jan 2 is 4 PM PST on Jan 1
    const date = '2024-01-02T00:00:00Z'
    const result = formatDateWithTimezone(date, 'America/Los_Angeles')

    // Check that it's formatted as a string containing some date parts
    expect(typeof result).toBe('string')
    // We can just verify it includes the timezone abbreviation
    expect(result).toMatch(/PST|PDT/)
  })

  test('should fallback to default format on invalid timezone', () => {
    const date = '2024-01-01'
    const invalidTimezone = 'Garbage/Timezone'

    // Suppress console.warn during test to avoid clutter
    const originalWarn = console.warn
    let warningLogged = false
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Invalid timezone: Garbage/Timezone')) {
        warningLogged = true
      }
    }

    const result = formatDateWithTimezone(date, invalidTimezone)
    const expectedFallback = formatDate(date, { includeTimezone: true })

    // Restore console.warn
    console.warn = originalWarn

    expect(result).toBe(expectedFallback)
    expect(warningLogged).toBe(true)
  })

  test('should handle Date objects properly with valid timezone', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    const result = formatDateWithTimezone(date, 'America/New_York')
    expect(typeof result).toBe('string')
    // Should contain the formatted date, might be Dec 31 or Jan 1 depending on TZ shift
  })

  test('should fallback to default format on invalid timezone with Date object', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    const invalidTimezone = 'Invalid/Timezone'

    // Suppress console.warn
    const originalWarn = console.warn
    console.warn = () => {}

    const result = formatDateWithTimezone(date, invalidTimezone)
    const expectedFallback = formatDate(date, { includeTimezone: true })

    // Restore console.warn
    console.warn = originalWarn

    expect(result).toBe(expectedFallback)
  })
})
