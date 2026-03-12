/**
 * Weather utilities using Open-Meteo API (free, no API key required)
 * https://open-meteo.com/
 */

export interface DailyForecast {
  date: string
  tempMax: number
  tempMin: number
  condition: string
  icon: string
  precipitation: number
  weatherCode: number
  isExtended?: boolean  // Day is beyond trip end date
  isPreTrip?: boolean   // Day is before trip start date
}

import { unstable_cache } from 'next/cache'

export interface DetailedWeatherData {
  temperature: {
    min: number
    max: number
    avg: number
  }
  condition: string
  icon: string
  precipitation: number
  humidity: number
  daily: DailyForecast[]
  location?: string
  timezone?: string  // IANA timezone (e.g., 'America/Los_Angeles')
  isCapped?: boolean
  cappedNote?: string
  availableDays?: number
  totalDays?: number
  tripDays?: number  // Actual days of trip
  extendedDays?: number  // Extra days fetched beyond trip
  preDays?: number  // Days before trip start
}

interface WeatherData {
  temperature: {
    min: number
    max: number
    avg: number
  }
  condition: string
  icon: string
  precipitation: number
  humidity: number
  location?: string
  timezone?: string  // IANA timezone
  isCapped?: boolean
  cappedNote?: string
  availableDays?: number
  totalDays?: number
}

interface GeocodingResult {
  latitude: number
  longitude: number
  name: string
  timezone?: string  // IANA timezone from geocoding
}

const MAX_FORECAST_DAYS = 14 // Open-Meteo free tier limit
const PRE_TRIP_DAYS = 2 // Days before trip to include

/**
 * Calculate days between two dates
 */
function getDaysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const diffMs = end.getTime() - start.getTime()
  return Math.ceil(diffMs / msPerDay) + 1 // +1 to include both start and end days
}

/**
 * Get coordinates for a location name using Open-Meteo Geocoding API
 */
export async function getCoordinates(location: string): Promise<GeocodingResult | null> {
  const cacheKey = location.toLowerCase().trim()
  
  const getCachedCoordinates = unstable_cache(
    async (loc: string) => {
      console.log('[Geocoding] Fetching fresh data for:', loc)
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
        const response = await fetch(url)

        if (!response.ok) {
          console.error('[Geocoding] API error:', response.status, response.statusText)
          return null
        }

        const data = await response.json()

        if (!data.results || data.results.length === 0) {
          console.error('[Geocoding] No results found for:', loc)
          return null
        }

        const result = data.results[0]
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          name: result.name,
          timezone: result.timezone // IANA timezone from geocoding API
        } as GeocodingResult
      } catch (error) {
        console.error('[Geocoding] Exception:', error)
        return null
      }
    },
    ['geocoding', cacheKey],
    { revalidate: 2592000 } // Cache for 30 days (30 * 24 * 60 * 60 seconds)
  )

  return getCachedCoordinates(location)
}

/**
 * Get detailed weather forecast with daily breakdown
 * Fetches 2 days before trip start + trip days + extends to 14 days total (or max forecast limit)
 * Marks pre-trip and extended days appropriately
 */
export async function getDetailedWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
  locationName?: string,
  timezone?: string
): Promise<DetailedWeatherData | null> {
  try {
    // Calculate trip length
    const tripDays = getDaysBetween(startDate, endDate)
    
    // Start fetching 2 days before trip
    const fetchStartDate = new Date(startDate)
    fetchStartDate.setDate(startDate.getDate() - PRE_TRIP_DAYS)
    
    // Don't fetch before today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const actualFetchStart = fetchStartDate < today ? today : fetchStartDate
    const actualPreDays = getDaysBetween(actualFetchStart, new Date(startDate.getTime() - 86400000)) // day before start
    
    // Calculate max forecast date
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + MAX_FORECAST_DAYS)
    
    // Fetch end date: Try to get full 14 days from actual start, or maxDate
    const idealFetchEnd = new Date(actualFetchStart)
    idealFetchEnd.setDate(actualFetchStart.getDate() + MAX_FORECAST_DAYS - 1)
    const fetchEndDate = idealFetchEnd < maxDate ? idealFetchEnd : maxDate
    
    const originalEndDate = new Date(endDate)
    const isCapped = originalEndDate > maxDate
    
    const totalDays = getDaysBetween(startDate, originalEndDate)
    const availableDays = getDaysBetween(actualFetchStart, fetchEndDate)
    const extendedDays = originalEndDate < fetchEndDate ? getDaysBetween(originalEndDate, fetchEndDate) - 1 : 0
    
    if (isCapped) {
      console.log('[Weather] Trip extends beyond 14-day forecast. Capping to:', fetchEndDate.toISOString().split('T')[0])
    } else {
      console.log('[Weather] Fetching forecast: 2 days prior + ', tripDays, 'day trip +', extendedDays, 'extended')
    }
    
    const start = actualFetchStart.toISOString().split('T')[0]
    const end = fetchEndDate.toISOString().split('T')[0]
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`
    console.log('[Weather] Fetching detailed forecast:', { location: locationName, start, end, preDays: actualPreDays, tripDays, extendedDays, timezone })
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('[Weather] API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    if (!data.daily) {
      console.error('[Weather] No daily data in response')
      return null
    }
    
    const temps = data.daily.temperature_2m_max || []
    const tempsMins = data.daily.temperature_2m_min || []
    const precip = data.daily.precipitation_sum || []
    const weatherCodes = data.daily.weathercode || []
    const dates = data.daily.time || []
    
    // Capture timezone from API response (IANA format)
    const apiTimezone = data.timezone || timezone
    
    if (temps.length === 0) {
      console.error('[Weather] Empty temperature data')
      return null
    }
    
    console.log('[Weather] Received', dates.length, 'days:', actualPreDays, 'pre +', tripDays, 'trip +', extendedDays, 'extended', `(${apiTimezone})`)
    
    // Build daily forecast array with pre-trip and extended marking
    const daily: DailyForecast[] = dates.map((date: string, index: number) => {
      const dateObj = new Date(date)
      const isPreTrip = dateObj < startDate
      const isExtended = dateObj > originalEndDate
      return {
        date,
        tempMax: Math.round(temps[index] || 0),
        tempMin: Math.round(tempsMins[index] || 0),
        condition: getWeatherCondition(weatherCodes[index] || 0),
        icon: getWeatherIcon(weatherCodes[index] || 0),
        precipitation: Math.round(precip[index] || 0),
        weatherCode: weatherCodes[index] || 0,
        isPreTrip,
        isExtended
      }
    })
    
    // Calculate averages ONLY for trip days (not pre or extended)
    const tripDaily = daily.filter(d => !d.isExtended && !d.isPreTrip)
    const tripTempsMax = tripDaily.map(d => d.tempMax)
    const tripTempsMin = tripDaily.map(d => d.tempMin)
    const tripPrecip = tripDaily.reduce((sum, d) => sum + d.precipitation, 0)
    
    const avgMax = tripTempsMax.reduce((a, b) => a + b, 0) / tripTempsMax.length
    const avgMin = tripTempsMin.reduce((a, b) => a + b, 0) / tripTempsMin.length
    const dominantWeatherCode = weatherCodes[actualPreDays] || weatherCodes[0] || 0  // Use first trip day
    
    const result: DetailedWeatherData = {
      temperature: {
        min: Math.round(avgMin),
        max: Math.round(avgMax),
        avg: Math.round((avgMax + avgMin) / 2)
      },
      condition: getWeatherCondition(dominantWeatherCode),
      icon: getWeatherIcon(dominantWeatherCode),
      precipitation: Math.round(tripPrecip),
      humidity: 0,
      daily,
      location: locationName,
      timezone: apiTimezone,
      isCapped,
      availableDays,
      totalDays,
      tripDays,
      extendedDays,
      preDays: actualPreDays
    }
    
    if (isCapped) {
      result.cappedNote = `Weather forecast available for first ${availableDays} of ${totalDays} days`
    }
    
    console.log('[Weather] Success:', result.temperature, result.condition, isCapped ? '(capped)' : '', `${actualPreDays} pre + ${extendedDays} extended`, apiTimezone)
    return result
  } catch (error) {
    console.error('[Weather] Exception:', error)
    return null
  }
}

/**
 * Get weather forecast for a location and date range
 * Automatically caps at 14 days from today
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
  locationName?: string,
  timezone?: string
): Promise<WeatherData | null> {
  try {
    // Cap end date at 14 days from today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + MAX_FORECAST_DAYS)
    
    const originalEndDate = new Date(endDate)
    const cappedEndDate = endDate > maxDate ? maxDate : endDate
    const isCapped = endDate > maxDate
    
    const totalDays = getDaysBetween(startDate, originalEndDate)
    const availableDays = getDaysBetween(startDate, cappedEndDate)
    
    if (isCapped) {
      console.log('[Weather] Trip extends beyond 14-day forecast. Capping to:', cappedEndDate.toISOString().split('T')[0])
    }
    
    const start = startDate.toISOString().split('T')[0]
    const end = cappedEndDate.toISOString().split('T')[0]
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`
    console.log('[Weather] Fetching forecast:', { location: locationName, start, end, isCapped, timezone })
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('[Weather] API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    if (!data.daily) {
      console.error('[Weather] No daily data in response')
      return null
    }
    
    // Capture timezone from API response
    const apiTimezone = data.timezone || timezone
    
    // Calculate averages over the trip period
    const temps = data.daily.temperature_2m_max || []
    const tempsMins = data.daily.temperature_2m_min || []
    const precip = data.daily.precipitation_sum || []
    const weatherCodes = data.daily.weathercode || []
    
    if (temps.length === 0) {
      console.error('[Weather] Empty temperature data')
      return null
    }
    
    const avgMax = temps.reduce((a: number, b: number) => a + b, 0) / temps.length
    const avgMin = tempsMins.reduce((a: number, b: number) => a + b, 0) / tempsMins.length
    const totalPrecip = precip.reduce((a: number, b: number) => a + b, 0)
    const dominantWeatherCode = weatherCodes[0] || 0
    
    const result: WeatherData = {
      temperature: {
        min: Math.round(avgMin),
        max: Math.round(avgMax),
        avg: Math.round((avgMax + avgMin) / 2)
      },
      condition: getWeatherCondition(dominantWeatherCode),
      icon: getWeatherIcon(dominantWeatherCode),
      precipitation: Math.round(totalPrecip),
      humidity: 0, // Not included in free tier
      location: locationName,
      timezone: apiTimezone,
      isCapped,
      availableDays,
      totalDays
    }
    
    if (isCapped) {
      result.cappedNote = `Weather forecast available for first ${availableDays} of ${totalDays} days`
    }
    
    console.log('[Weather] Success:', result.temperature, result.condition, isCapped ? '(capped)' : '', apiTimezone)
    return result
  } catch (error) {
    console.error('[Weather] Exception:', error)
    return null
  }
}

/**
 * Convert WMO weather code to condition string
 * https://open-meteo.com/en/docs
 */
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail'
  }
  return conditions[code] || 'Unknown'
}

/**
 * Convert WMO weather code to emoji icon
 */
function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}

/**
 * Get weather for a location by name and date range
 */
export async function getLocationWeather(
  location: string,
  startDate: Date,
  endDate: Date
): Promise<WeatherData | null> {
  // Use date string (YYYY-MM-DD) for cache keys instead of exact ISO strings to share cache across times
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  const cacheKey = `${location.toLowerCase().trim()}:${startStr}:${endStr}`
  
  const getCachedWeather = unstable_cache(
    async (loc: string, start: Date, end: Date) => {
      console.log('[Weather] Cache miss for:', loc, startStr, endStr)
      const coords = await getCoordinates(loc)
      if (!coords) return null

      return await getWeatherForecast(coords.latitude, coords.longitude, start, end, coords.name, coords.timezone)
    },
    ['weather', cacheKey],
    { revalidate: 1800 } // Cache for 30 minutes (30 * 60 seconds)
  )

  return getCachedWeather(location, startDate, endDate)
}

/**
 * Get detailed weather with daily breakdown for a location
 */
export async function getDetailedLocationWeather(
  location: string,
  startDate: Date,
  endDate: Date
): Promise<DetailedWeatherData | null> {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]
  const cacheKey = `detailed:${location.toLowerCase().trim()}:${startStr}:${endStr}`
  
  const getCachedDetailedWeather = unstable_cache(
    async (loc: string, start: Date, end: Date) => {
      console.log('[Weather] Detailed cache miss for:', loc, startStr, endStr)
      const coords = await getCoordinates(loc)
      if (!coords) return null

      return await getDetailedWeatherForecast(coords.latitude, coords.longitude, start, end, coords.name, coords.timezone)
    },
    ['detailed_weather', cacheKey],
    { revalidate: 1800 } // Cache for 30 minutes (30 * 60 seconds)
  )

  return getCachedDetailedWeather(location, startDate, endDate)
}
