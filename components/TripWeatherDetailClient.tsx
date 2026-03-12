'use client'

import { useState } from 'react'
import { DetailedTripWeather } from '@/actions/weather.actions'

interface TripWeatherDetailClientProps {
  weather: DetailedTripWeather
  headerChildren: React.ReactNode
  expandedChildren: React.ReactNode
}

export default function TripWeatherDetailClient({ weather, headerChildren, expandedChildren }: TripWeatherDetailClientProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-lg border border-blue-100 relative cursor-help shadow-sm overflow-hidden transition-all"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Ultra-compact preview - no capped warning when collapsed */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white hover:bg-opacity-30 transition-colors text-left gap-2"
        aria-expanded={isExpanded}
        aria-controls="weather-details"
      >
        {headerChildren}

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details - show all info here */}
      {isExpanded && expandedChildren}

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
