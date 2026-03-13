import { getTripWeather, getDetailedTripWeather, TripWeather as TripWeatherData, DetailedTripWeather } from '@/actions/weather.actions'
import TripWeatherCardClient from './TripWeatherCardClient'
import TripWeatherDetailClient from './TripWeatherDetailClient'

interface TripWeatherProps {
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  variant?: 'card' | 'detail'
}

export default async function TripWeather({ destination, startDate, endDate, variant = 'card' }: TripWeatherProps) {
  if (!destination || !startDate || !endDate) {
    return null
  }

  let weather: TripWeatherData | DetailedTripWeather | null = null
  let error: string | null = null

  try {
    if (variant === 'detail') {
      const { weather: data, error: apiError } = await getDetailedTripWeather(destination, startDate, endDate)
      if (apiError) error = apiError
      else if (data) weather = data
    } else {
      const { weather: data, error: apiError } = await getTripWeather(destination, startDate, endDate)
      if (apiError) error = apiError
      else if (data) weather = data
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  const isCard = variant === 'card'

  if (isCard) {
    if (error) {
      return (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-red-600">
            Weather unavailable
          </div>
        </div>
      )
    }

    if (!weather) return null

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

  // Detail variant
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-3">
        <div className="flex items-start gap-2">
          <span className="text-red-600 text-sm">⚠️</span>
          <div>
            <p className="text-xs font-medium text-red-900">Weather unavailable</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const detailedWeather = weather as DetailedTripWeather
  const hasDaily = detailedWeather.daily && detailedWeather.daily.length > 0
  const preTripDays = detailedWeather.daily?.filter(d => d.isPreTrip) || []
  const tripDays = detailedWeather.daily?.filter(d => !d.isExtended && !d.isPreTrip) || []
  const extendedDays = detailedWeather.daily?.filter(d => d.isExtended) || []

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const headerChildren = (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-xl flex-shrink-0">{weather.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-gray-700">
          {weather.location ? `Weather Forecast of ${weather.location}` : 'Weather Forecast'}
        </div>
        <div className="text-xs text-gray-600">
          {weather.temperature.min}°-{weather.temperature.max}°F • {weather.condition}
          {weather.precipitation > 0 && ` • 💧${weather.precipitation}mm`}
        </div>
      </div>
    </div>
  )

  const expandedChildren = (
    <div id="weather-details" className="px-3 pb-3 border-t border-blue-100">
      {/* Capped forecast warning - only when expanded */}
      {weather.isCapped && weather.cappedNote && (
        <div className="my-2 text-xs text-amber-700 bg-amber-50 rounded-md px-2.5 py-1.5 border border-amber-200">
          <div className="flex items-start gap-1.5">
            <span className="flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-medium">{weather.cappedNote}</p>
              <p className="text-[10px] mt-0.5 text-amber-600">Forecast limited to 14 days from today. Plan ahead for longer trips!</p>
            </div>
          </div>
        </div>
      )}

      {/* Extended forecast info - when extra days are shown */}
      {(preTripDays.length > 0 || extendedDays.length > 0) && !weather.isCapped && (
        <div className="my-2 text-xs text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5 border border-blue-200">
          <div className="flex items-start gap-1.5">
            <span className="flex-shrink-0">🔮</span>
            <div>
              <p className="font-medium">
                {preTripDays.length > 0 && extendedDays.length > 0 && `${preTripDays.length} pre-trip + ${extendedDays.length} extended days included`}
                {preTripDays.length > 0 && extendedDays.length === 0 && `${preTripDays.length} pre-trip days included`}
                {preTripDays.length === 0 && extendedDays.length > 0 && `${extendedDays.length} extended days included`}
              </p>
              <p className="text-[10px] mt-0.5 text-blue-600">
                {preTripDays.length > 0 && 'Pre-trip weather helps plan travel. '}
                {extendedDays.length > 0 && 'Extended days provide planning flexibility'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal scrollable day-by-day forecast */}
      {hasDaily && (
        <div className="my-2 -mx-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 px-1 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            {/* Pre-trip days - muted purple style */}
            {preTripDays.map((day) => (
              <div
                key={day.date}
                className="flex-shrink-0 bg-purple-50 bg-opacity-60 rounded-md p-2 min-w-[85px] text-center backdrop-blur-sm border border-dashed border-purple-300"
                title="Pre-trip day (before departure)"
              >
                <div className="text-[10px] font-medium text-purple-600 mb-1">{formatDate(day.date)}</div>
                <div className="text-2xl mb-1 opacity-60">{day.icon}</div>
                <div className="text-xs font-semibold text-purple-700">
                  {day.tempMax}°F
                </div>
                <div className="text-[10px] text-purple-500 mb-1">
                  {day.tempMin}°F
                </div>
                <div className="text-[10px] text-purple-600 line-clamp-1" title={day.condition}>
                  {day.condition}
                </div>
                {day.precipitation > 0 && (
                  <div className="text-[10px] text-purple-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <span>💧</span>
                    <span>{day.precipitation}mm</span>
                  </div>
                )}
              </div>
            ))}

            {/* Trip days - bright white style */}
            {tripDays.map((day) => (
              <div
                key={day.date}
                className="flex-shrink-0 bg-white bg-opacity-70 rounded-md p-2 min-w-[85px] text-center backdrop-blur-sm"
              >
                <div className="text-[10px] font-medium text-gray-700 mb-1">{formatDate(day.date)}</div>
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="text-xs font-semibold text-gray-900">
                  {day.tempMax}°F
                </div>
                <div className="text-[10px] text-gray-500 mb-1">
                  {day.tempMin}°F
                </div>
                <div className="text-[10px] text-gray-600 line-clamp-1" title={day.condition}>
                  {day.condition}
                </div>
                {day.precipitation > 0 && (
                  <div className="text-[10px] text-blue-600 flex items-center justify-center gap-0.5 mt-0.5">
                    <span>💧</span>
                    <span>{day.precipitation}mm</span>
                  </div>
                )}
              </div>
            ))}

            {/* Extended days - muted gray style */}
            {extendedDays.map((day) => (
              <div
                key={day.date}
                className="flex-shrink-0 bg-gray-50 bg-opacity-80 rounded-md p-2 min-w-[85px] text-center backdrop-blur-sm border border-dashed border-gray-300"
                title="Extended forecast (after trip end)"
              >
                <div className="text-[10px] font-medium text-gray-500 mb-1">{formatDate(day.date)}</div>
                <div className="text-2xl mb-1 opacity-60">{day.icon}</div>
                <div className="text-xs font-semibold text-gray-700">
                  {day.tempMax}°F
                </div>
                <div className="text-[10px] text-gray-400 mb-1">
                  {day.tempMin}°F
                </div>
                <div className="text-[10px] text-gray-500 line-clamp-1" title={day.condition}>
                  {day.condition}
                </div>
                {day.precipitation > 0 && (
                  <div className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <span>💧</span>
                    <span>{day.precipitation}mm</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packing suggestions */}
      <div className="pt-2 border-t border-blue-100">
        <div className="flex items-start gap-1.5 text-[11px] text-gray-600">
          <span className="flex-shrink-0">🧳</span>
          <div className="leading-snug">
            <span className="font-medium">Pack: </span>
            {weather.temperature.avg < 50 && 'Warm layers & jacket. '}
            {weather.temperature.avg >= 50 && weather.temperature.avg < 70 && 'Light layers. '}
            {weather.temperature.avg >= 70 && 'Light clothing. '}
            {weather.precipitation > 10 && 'Rain gear essential. '}
            {weather.precipitation > 0 && weather.precipitation <= 10 && 'Umbrella recommended. '}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <TripWeatherDetailClient
      weather={detailedWeather}
      headerChildren={headerChildren}
      expandedChildren={expandedChildren}
    />
  )
}
