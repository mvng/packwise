import { test, expect } from '@playwright/test'
import { getTripDuration } from '../lib/utils'

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
