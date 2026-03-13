'use client'

import { useState } from 'react'
import { TripWeather as TripWeatherData } from '@/actions/weather.actions'

interface TripWeatherCardClientProps {
  weather: TripWeatherData
  children: React.ReactNode
}

export default function TripWeatherCardClient({ weather, children }: TripWeatherCardClientProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="mt-3 pt-3 border-t border-gray-100 relative cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {/* Tooltip - includes capped warning on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
          {weather.isCapped && weather.cappedNote && (
            <p className="leading-relaxed mb-2 pb-2 border-b border-gray-700 text-amber-300">
              <span className="font-medium">ℹ️ {weather.cappedNote}</span>
            </p>
          )}
          <p className="leading-relaxed">
            Weather forecasts are estimates and may change. Always check current conditions closer to your trip dates.
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  )
}
