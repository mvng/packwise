'use client'

import { useEffect, useState } from 'react'
import { getTripWeather, TripWeather as TripWeatherData } from '@/actions/weather.actions'

interface TripWeatherProps {
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
}

export default function TripWeather({ destination, startDate, endDate }: TripWeatherProps) {
  const [weather, setWeather] = useState<TripWeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWeather() {
      if (!destination || !startDate || !endDate) {
        setLoading(false)
        return
      }

      try {
        const { weather: data } = await getTripWeather(destination, startDate, endDate)
        setWeather(data)
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [destination, startDate, endDate])

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="animate-pulse">Loading weather...</div>
        </div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{weather.icon}</span>
          <div>
            <p className="text-xs font-medium text-gray-700">
              {weather.temperature.min}°F - {weather.temperature.max}°F
            </p>
            <p className="text-xs text-gray-500">{weather.condition}</p>
          </div>
        </div>
        {weather.precipitation > 0 && (
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <span>💧</span>
            <span>{weather.precipitation}mm</span>
          </div>
        )}
      </div>
    </div>
  )
}
