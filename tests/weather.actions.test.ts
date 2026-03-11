import { test, expect } from '@playwright/test'
import { getTripWeather, getDetailedTripWeather } from '../actions/weather.actions'
import * as weatherLib from '../lib/weather'

test.describe('Weather Actions', () => {
  test.describe('getTripWeather', () => {
    test('should return null weather when destination is falsy', async () => {
      const result = await getTripWeather('', '2024-01-01', '2024-01-05')
      expect(result).toEqual({ weather: null })
    })

    test('should handle errors from getLocationWeather and return error message', async () => {
      const originalGetLocationWeather = weatherLib.getLocationWeather
      const errorMessage = 'API Error'

      Object.defineProperty(weatherLib, 'getLocationWeather', {
        value: async () => { throw new Error(errorMessage) },
        writable: true,
        configurable: true
      })

      try {
        const result = await getTripWeather('Paris', '2024-01-01', '2024-01-05')
        expect(result).toEqual({ weather: null, error: errorMessage })
      } finally {
        Object.defineProperty(weatherLib, 'getLocationWeather', {
          value: originalGetLocationWeather,
          writable: true,
          configurable: true
        })
      }
    })
  })

  test.describe('getDetailedTripWeather', () => {
    test('should return null weather when destination is falsy', async () => {
      const result = await getDetailedTripWeather('', '2024-01-01', '2024-01-05')
      expect(result).toEqual({ weather: null })
    })
  })
})
