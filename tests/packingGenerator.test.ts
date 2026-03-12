import { test, expect } from '@playwright/test'
import { generatePackingList, isDomesticDrive } from '../utils/packingGenerator'

test.describe('isDomesticDrive', () => {
  test('should return true for cities close to each other', () => {
    // New York and Boston are ~306 km apart
    expect(isDomesticDrive('boston', 'new york')).toBe(true)
    // New York and Philadelphia (not in coords, but NYC is close to NYC)
    expect(isDomesticDrive('new york city', 'nyc')).toBe(true)
  })

  test('should return false for cities far from each other', () => {
    // New York and Los Angeles are > 3900 km apart
    expect(isDomesticDrive('los angeles', 'new york')).toBe(false)
  })

  test('should handle missing homeCity', () => {
    expect(isDomesticDrive('boston', null)).toBe(false)
    expect(isDomesticDrive('boston', undefined)).toBe(false)
    expect(isDomesticDrive('boston', '')).toBe(false)
  })

  test('should handle unknown destination or homeCity', () => {
    // Unknown city vs known city
    expect(isDomesticDrive('unknown city', 'new york')).toBe(false)
    // Known city vs unknown city
    expect(isDomesticDrive('boston', 'unknown city')).toBe(false)
    // Both unknown
    expect(isDomesticDrive('unknown city', 'another unknown')).toBe(false)
  })

  test('should handle substring matches for destination', () => {
    // "Boston, MA" includes "boston" which is in coords
    expect(isDomesticDrive('Boston, MA', 'new york')).toBe(true)
    // "Los Angeles, CA" includes "los angeles"
    expect(isDomesticDrive('Los Angeles, CA', 'new york')).toBe(false)
  })

  test('should be case insensitive', () => {
    expect(isDomesticDrive('BOSTON', 'NEW YORK')).toBe(true)
  })
})

test.describe('generatePackingList', () => {
  test('should always include base categories (Documents, Electronics, Toiletries)', () => {
    const list = generatePackingList('leisure', 5)

    expect(list.some(c => c.name === 'Documents')).toBe(true)
    expect(list.some(c => c.name === 'Electronics')).toBe(true)
    expect(list.some(c => c.name === 'Toiletries')).toBe(true)
  })

  test('should include specific categories based on tripType', () => {
    const beachList = generatePackingList('beach', 5)
    expect(beachList.some(c => c.name === 'Beach Accessories')).toBe(true)

    const businessList = generatePackingList('business', 3)
    expect(businessList.some(c => c.name === 'Work Essentials')).toBe(true)

    const hikingList = generatePackingList('hiking', 2)
    expect(hikingList.some(c => c.name === 'Hiking Gear')).toBe(true)

    const cityList = generatePackingList('city', 4)
    expect(cityList.some(c => c.name === 'City Essentials')).toBe(true)

    const skiingList = generatePackingList('skiing', 6)
    expect(skiingList.some(c => c.name === 'Ski Gear')).toBe(true)

    const leisureList = generatePackingList('leisure', 7)
    expect(leisureList.some(c => c.name === 'Leisure Essentials')).toBe(true)
  })

  test('should append transport essentials if transportMode is provided', () => {
    const flightList = generatePackingList('leisure', 5, 'flight')
    expect(flightList.some(c => c.name === 'Flight Essentials')).toBe(true)

    const carList = generatePackingList('leisure', 5, 'car')
    expect(carList.some(c => c.name === 'Road Trip Essentials')).toBe(true)

    const trainList = generatePackingList('leisure', 5, 'train')
    expect(trainList.some(c => c.name === 'Train Essentials')).toBe(true)

    const cruiseList = generatePackingList('leisure', 5, 'cruise')
    expect(cruiseList.some(c => c.name === 'Cruise Essentials')).toBe(true)
  })

  test('should scale clothing quantities based on duration', () => {
    // Math.min(duration + 1, 7)
    // 2 days -> qty = 3
    const shortTrip = generatePackingList('leisure', 2)
    const shortClothing = shortTrip.find(c => c.name === 'Clothing')
    expect(shortClothing?.items).toContain('T-shirts (3)')
    expect(shortClothing?.items).toContain('Underwear (4)') // qty + 1

    // 10 days -> qty = 7 (capped at 7)
    const longTrip = generatePackingList('leisure', 10)
    const longClothing = longTrip.find(c => c.name === 'Clothing')
    expect(longClothing?.items).toContain('T-shirts (7)')
    expect(longClothing?.items).toContain('Underwear (8)') // qty + 1
  })

  test('should cap clothing quantities at 7 for long durations (e.g., 14 days)', () => {
    // 14 days -> qty = 7 (capped at 7)
    const extremelyLongTrip = generatePackingList('leisure', 14)
    const extremelyLongClothing = extremelyLongTrip.find(c => c.name === 'Clothing')
    expect(extremelyLongClothing?.items).toContain('T-shirts (7)')
    expect(extremelyLongClothing?.items).not.toContain('T-shirts (14)')
    expect(extremelyLongClothing?.items).toContain('Underwear (8)') // qty + 1
    expect(extremelyLongClothing?.items).not.toContain('Underwear (15)')
  })

  test('should replace Hotel confirmations with saved online hint if hotelConfirmationUrl is present', () => {
    const list = generatePackingList('leisure', 5, null, {
      hotelConfirmationUrl: 'https://hotel.com/conf123'
    })

    const docs = list.find(c => c.name === 'Documents')
    expect(docs?.items).toContain('Hotel confirmation (saved online ✓)')
    expect(docs?.items).not.toContain('Hotel confirmations')
  })

  test('should omit Passport and Boarding passes for a domestic drive (nearHome = true)', () => {
    // New York and Boston -> nearHome = true
    const list = generatePackingList('leisure', 5, null, {
      homeCity: 'new york',
      destination: 'boston'
    })

    const docs = list.find(c => c.name === 'Documents')
    expect(docs?.items).not.toContain('Passport')
    expect(docs?.items).not.toContain('Boarding passes')
  })

  test('should include Passport and Boarding passes for a non-domestic drive (nearHome = false)', () => {
    // New York and London -> nearHome = false
    const list = generatePackingList('leisure', 5, null, {
      homeCity: 'new york',
      destination: 'london'
    })

    const docs = list.find(c => c.name === 'Documents')
    expect(docs?.items).toContain('Passport')
    expect(docs?.items).toContain('Boarding passes')
  })
})
