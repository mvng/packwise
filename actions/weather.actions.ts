'use server'

import { getLocationWeather, getDetailedLocationWeather, DailyForecast } from '@/lib/weather'

export interface TripWeather {
  temperature: {
    min: number
    max: number
    avg: number
  }
  condition: string
  icon: string
  precipitation: number
  location?: string
}

export interface DetailedTripWeather extends TripWeather {
  daily: DailyForecast[]
}

/**
 * Get weather forecast for a trip
 */
export async function getTripWeather(
  destination: string,
  startDate: Date | string,
  endDate: Date | string
): Promise<{ weather: TripWeather | null; error?: string }> {
  try {
    if (!destination) {
      return { weather: null }
    }

    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate

    const weather = await getLocationWeather(destination, start, end)
    return { weather }
  } catch (error: any) {
    console.error('Get trip weather error:', error)
    return { weather: null, error: error.message }
  }
}

/**
 * Get detailed weather forecast with daily breakdown for a trip
 * Always shows up to 14 days of forecast from the trip start date
 */
export async function getDetailedTripWeather(
  destination: string,
  startDate: Date | string,
  endDate: Date | string
): Promise<{ weather: DetailedTripWeather | null; error?: string }> {
  try {
    if (!destination) {
      return { weather: null }
    }

    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate

    // Calculate forecast end date: either trip end or start + 14 days, whichever is greater
    const maxForecastEnd = new Date(start)
    maxForecastEnd.setDate(maxForecastEnd.getDate() + 13) // +13 to include start day (14 total days)
    
    // Use the later of trip end date or 14-day forecast end
    const forecastEnd = end > maxForecastEnd ? end : maxForecastEnd

    const weather = await getDetailedLocationWeather(destination, start, forecastEnd)
    return { weather }
  } catch (error: any) {
    console.error('Get detailed trip weather error:', error)
    return { weather: null, error: error.message }
  }
}
