'use client'

import { useEffect, useState } from 'react'
import { getTripWeather, TripWeather as TripWeatherData } from '@/actions/weather.actions'
import TripWeatherCardClient from './TripWeatherCardClient'
import TripWeatherSkeleton from './TripWeatherSkeleton'

interface DashboardTripWeatherProps {
  destination: string
  startDate: Date | string
  endDate: Date | string
}

export default function DashboardTripWeather({
  destination,
  startDate,
  endDate,
}: DashboardTripWeatherProps) {
  const [weather, setWeather] = useState<TripWeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchWeather = async () => {
      try {
        const { weather: data, error: apiError } = await getTripWeather(
          destination,
          startDate,
          endDate
        )
        if (!mounted) return

        if (apiError) {
          setError(apiError)
        } else if (data) {
          setWeather(data)
        }
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchWeather()

    return () => {
      mounted = false
    }
  }, [destination, startDate, endDate])

  if (loading) {
    return <TripWeatherSkeleton variant="card" />
  }

  if (error || !weather) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-red-600">Weather unavailable</div>
      </div>
    )
  }

  return (
    <TripWeatherCardClient weather={weather}>
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
    </TripWeatherCardClient>
  )
}
