'use server'

import { getLocationWeather } from '@/lib/weather'

export interface TripWeather {
  temperature: {
    min: number
    max: number
    avg: number
  }
  condition: string
  icon: string
  precipitation: number
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

    // Only fetch weather for future trips or trips within 14 days
    const now = new Date()
    const daysDiff = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < -14 || daysDiff > 14) {
      // Too far in past or future for accurate forecast
      return { weather: null }
    }

    const weather = await getLocationWeather(destination, start, end)
    return { weather }
  } catch (error: any) {
    console.error('Get trip weather error:', error)
    return { weather: null, error: error.message }
  }
}
