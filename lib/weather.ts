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
}

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
}

interface GeocodingResult {
  latitude: number
  longitude: number
  name: string
}

// In-memory caches
const geocodingCache = new Map<string, { data: GeocodingResult; expires: number }>()
const weatherCache = new Map<string, { data: WeatherData; expires: number }>()
const detailedWeatherCache = new Map<string, { data: DetailedWeatherData; expires: number }>()

const GEOCODING_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days (coordinates don't change)
const WEATHER_TTL = 30 * 60 * 1000 // 30 minutes (balance freshness vs performance)

/**
 * Get coordinates for a location name using Open-Meteo Geocoding API
 */
export async function getCoordinates(location: string): Promise<GeocodingResult | null> {
  const cacheKey = location.toLowerCase().trim()
  
  console.log('[Geocoding] Request for:', location)
  
  // Check cache
  const cached = geocodingCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log('[Geocoding] Cache hit:', cached.data.name)
    return cached.data
  }
  
  console.log('[Geocoding] Cache miss')
  
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    console.log('[Geocoding] Fetching:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('[Geocoding] API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    
    if (!data.results || data.results.length === 0) {
      console.error('[Geocoding] No results found for:', location)
      return null
    }
    
    const result = data.results[0]
    const coords = {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name
    }
    
    console.log('[Geocoding] Success:', coords)
    
    // Cache the result
    geocodingCache.set(cacheKey, {
      data: coords,
      expires: Date.now() + GEOCODING_TTL
    })
    
    return coords
  } catch (error) {
    console.error('[Geocoding] Exception:', error)
    return null
  }
}

/**
 * Get detailed weather forecast with daily breakdown
 */
export async function getDetailedWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
  locationName?: string
): Promise<DetailedWeatherData | null> {
  try {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`
    console.log('[Weather] Fetching detailed forecast:', { location: locationName, start, end })
    
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
    
    if (temps.length === 0) {
      console.error('[Weather] Empty temperature data')
      return null
    }
    
    console.log('[Weather] Received', dates.length, 'days of forecast')
    
    // Build daily forecast array
    const daily: DailyForecast[] = dates.map((date: string, index: number) => ({
      date,
      tempMax: Math.round(temps[index] || 0),
      tempMin: Math.round(tempsMins[index] || 0),
      condition: getWeatherCondition(weatherCodes[index] || 0),
      icon: getWeatherIcon(weatherCodes[index] || 0),
      precipitation: Math.round(precip[index] || 0),
      weatherCode: weatherCodes[index] || 0
    }))
    
    // Calculate averages
    const avgMax = temps.reduce((a: number, b: number) => a + b, 0) / temps.length
    const avgMin = tempsMins.reduce((a: number, b: number) => a + b, 0) / tempsMins.length
    const totalPrecip = precip.reduce((a: number, b: number) => a + b, 0)
    const dominantWeatherCode = weatherCodes[0] || 0
    
    const result = {
      temperature: {
        min: Math.round(avgMin),
        max: Math.round(avgMax),
        avg: Math.round((avgMax + avgMin) / 2)
      },
      condition: getWeatherCondition(dominantWeatherCode),
      icon: getWeatherIcon(dominantWeatherCode),
      precipitation: Math.round(totalPrecip),
      humidity: 0,
      daily,
      location: locationName
    }
    
    console.log('[Weather] Success:', result.temperature, result.condition)
    return result
  } catch (error) {
    console.error('[Weather] Exception:', error)
    return null
  }
}

/**
 * Get weather forecast for a location and date range
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
  locationName?: string
): Promise<WeatherData | null> {
  try {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`
    console.log('[Weather] Fetching forecast:', { location: locationName, start, end })
    
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
    
    const result = {
      temperature: {
        min: Math.round(avgMin),
        max: Math.round(avgMax),
        avg: Math.round((avgMax + avgMin) / 2)
      },
      condition: getWeatherCondition(dominantWeatherCode),
      icon: getWeatherIcon(dominantWeatherCode),
      precipitation: Math.round(totalPrecip),
      humidity: 0, // Not included in free tier
      location: locationName
    }
    
    console.log('[Weather] Success:', result.temperature, result.condition)
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
  const cacheKey = `${location}:${startDate.toISOString()}:${endDate.toISOString()}`
  
  // Check cache
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log('[Weather] Cache hit for:', location)
    return cached.data
  }
  
  console.log('[Weather] Cache miss for:', location)
  const coords = await getCoordinates(location)
  if (!coords) return null
  
  const weather = await getWeatherForecast(coords.latitude, coords.longitude, startDate, endDate, coords.name)
  
  // Cache the result
  if (weather) {
    weatherCache.set(cacheKey, {
      data: weather,
      expires: Date.now() + WEATHER_TTL
    })
    console.log('[Weather] Cached for 30 minutes')
  }
  
  return weather
}

/**
 * Get detailed weather with daily breakdown for a location
 */
export async function getDetailedLocationWeather(
  location: string,
  startDate: Date,
  endDate: Date
): Promise<DetailedWeatherData | null> {
  const cacheKey = `detailed:${location}:${startDate.toISOString()}:${endDate.toISOString()}`
  
  // Check cache
  const cached = detailedWeatherCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    console.log('[Weather] Detailed cache hit for:', location)
    return cached.data
  }
  
  console.log('[Weather] Detailed cache miss for:', location)
  const coords = await getCoordinates(location)
  if (!coords) return null
  
  const weather = await getDetailedWeatherForecast(coords.latitude, coords.longitude, startDate, endDate, coords.name)
  
  // Cache the result
  if (weather) {
    detailedWeatherCache.set(cacheKey, {
      data: weather,
      expires: Date.now() + WEATHER_TTL
    })
    console.log('[Weather] Detailed cached for 30 minutes')
  }
  
  return weather
}
