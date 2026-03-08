'use client'

import { useEffect, useState } from 'react'
import { getTripWeather, TripWeather as TripWeatherData } from '@/actions/weather.actions'

interface TripWeatherProps {
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  variant?: 'card' | 'detail'
}

export default function TripWeather({ destination, startDate, endDate, variant = 'card' }: TripWeatherProps) {
  const [weather, setWeather] = useState<TripWeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

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

  // Detail variant - enhanced display
  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-xl border border-blue-100 p-5 relative cursor-help shadow-sm"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="text-5xl">{weather.icon}</div>
          <div className="flex-1">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Weather Forecast</h3>
              <p className="text-xs text-gray-500">Expected conditions for your trip</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-white bg-opacity-60 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Temperature Range</div>
                <div className="text-lg font-semibold text-gray-900">
                  {weather.temperature.min}°F - {weather.temperature.max}°F
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Avg: {weather.temperature.avg}°F
                </div>
              </div>

              {/* Conditions */}
              <div className="bg-white bg-opacity-60 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Conditions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {weather.condition}
                </div>
                {weather.precipitation > 0 && (
                  <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                    <span>💧</span>
                    <span>{weather.precipitation}mm expected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Packing suggestions based on weather */}
      <div className="mt-4 pt-4 border-t border-blue-100">
        <div className="flex items-start gap-2">
          <span className="text-sm">🧳</span>
          <div className="text-xs text-gray-600">
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
