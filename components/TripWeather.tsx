'use client'

import { useEffect, useState } from 'react'
import { getTripWeather, getDetailedTripWeather, TripWeather as TripWeatherData, DetailedTripWeather } from '@/actions/weather.actions'

interface TripWeatherProps {
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  variant?: 'card' | 'detail'
}

export default function TripWeather({ destination, startDate, endDate, variant = 'card' }: TripWeatherProps) {
  const [weather, setWeather] = useState<TripWeatherData | DetailedTripWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      if (!destination || !startDate || !endDate) {
        setLoading(false)
        return
      }

      try {
        if (variant === 'detail') {
          const { weather: data } = await getDetailedTripWeather(destination, startDate, endDate)
          setWeather(data)
        } else {
          const { weather: data } = await getTripWeather(destination, startDate, endDate)
          setWeather(data)
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [destination, startDate, endDate, variant])

  if (loading) {
    if (variant === 'card') {
      return (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="animate-pulse">Loading weather...</div>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="animate-pulse">Loading weather forecast...</div>
        </div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const isCard = variant === 'card'

  // Card variant - compact display
  if (isCard) {
    return (
      <div 
        className="mt-3 pt-3 border-t border-gray-100 relative cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
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

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
            <p className="leading-relaxed">
              Weather forecasts are estimates and may change. Always check current conditions closer to your trip dates.
            </p>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}
      </div>
    )
  }

  // Detail variant - horizontal scrollable forecast
  const detailedWeather = weather as DetailedTripWeather
  const hasDaily = detailedWeather.daily && detailedWeather.daily.length > 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-xl border border-blue-100 p-5 relative cursor-help shadow-sm"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Weather Forecast</h3>
        <p className="text-xs text-gray-500">Expected conditions for your trip</p>
      </div>

      {/* Horizontal scrollable day-by-day forecast */}
      {hasDaily && (
        <div className="mb-4 -mx-1">
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            {detailedWeather.daily.slice(0, 7).map((day) => (
              <div 
                key={day.date}
                className="flex-shrink-0 bg-white bg-opacity-70 rounded-lg p-3 min-w-[110px] text-center backdrop-blur-sm"
              >
                <div className="text-xs font-medium text-gray-700 mb-2">{formatDate(day.date)}</div>
                <div className="text-3xl mb-2">{day.icon}</div>
                <div className="text-xs font-semibold text-gray-900 mb-0.5">
                  {day.tempMax}°F
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {day.tempMin}°F
                </div>
                <div className="text-xs text-gray-600 mb-1 line-clamp-1" title={day.condition}>
                  {day.condition}
                </div>
                {day.precipitation > 0 && (
                  <div className="text-xs text-blue-600 flex items-center justify-center gap-1">
                    <span>💧</span>
                    <span>{day.precipitation}mm</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="pt-3 border-t border-blue-100">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span>🧳</span>
          <div>
            <span className="font-medium">Pack accordingly: </span>
            {weather.temperature.avg < 50 && 'Bring warm layers and a jacket. '}
            {weather.temperature.avg >= 50 && weather.temperature.avg < 70 && 'Light layers recommended. '}
            {weather.temperature.avg >= 70 && 'Light clothing suitable. '}
            {weather.precipitation > 10 && 'Rain gear essential. '}
            {weather.precipitation > 0 && weather.precipitation <= 10 && 'Consider bringing an umbrella. '}
          </div>
        </div>
      </div>

      {/* Disclaimer tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
          <p className="leading-relaxed">
            Weather forecasts are estimates and may change. Always check current conditions closer to your trip dates.
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  )
}
