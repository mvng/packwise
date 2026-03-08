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
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="animate-pulse">Loading weather...</div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const isCard = variant === 'card'

  return (
    <div className={isCard ? 'mt-3 pt-3 border-t border-gray-100' : 'bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-100 p-4'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={isCard ? 'text-xl' : 'text-2xl'}>{weather.icon}</span>
          <div className="flex items-center gap-1.5">
            <div>
              <p className={`${isCard ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
                {weather.temperature.min}°F - {weather.temperature.max}°F
              </p>
              <p className={`${isCard ? 'text-xs' : 'text-sm'} text-gray-500`}>{weather.condition}</p>
            </div>
            {/* Subtle disclaimer icon */}
            <div className="relative inline-block">
              <div 
                className="text-[10px] text-gray-300 hover:text-gray-400 cursor-help transition-colors ml-0.5"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                ⓘ
              </div>
              
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
                  <p className="leading-relaxed">
                    Weather forecasts are estimates and may change. Always check current conditions closer to your trip dates.
                  </p>
                  {/* Tooltip arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        {weather.precipitation > 0 && (
          <div className={`${isCard ? 'text-xs' : 'text-sm'} text-blue-600 flex items-center gap-1`}>
            <span>💧</span>
            <span>{weather.precipitation}mm</span>
          </div>
        )}
      </div>
    </div>
  )
}
