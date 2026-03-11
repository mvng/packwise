import { test, expect } from '@playwright/test'
import { getTripWeather, getDetailedTripWeather } from '../actions/weather.actions'

test.describe('Weather Actions', () => {
  test.describe('getTripWeather', () => {
    test('should return null weather when destination is falsy', async () => {
      const result = await getTripWeather('', '2024-01-01', '2024-01-05')
      expect(result).toEqual({ weather: null })
    })
  })

  test.describe('getDetailedTripWeather', () => {
    test('should return null weather when destination is falsy', async () => {
      const result = await getDetailedTripWeather('', '2024-01-01', '2024-01-05')
      expect(result).toEqual({ weather: null })
    })
  })
})
