/**
 * Weather utilities using Open-Meteo API (free, no API key required)
 * https://open-meteo.com/
 */

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
}

interface GeocodingResult {
  latitude: number
  longitude: number
  name: string
}

/**
 * Get coordinates for a location name using Open-Meteo Geocoding API
 */
export async function getCoordinates(location: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (!data.results || data.results.length === 0) return null
    
    const result = data.results[0]
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
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
  endDate: Date
): Promise<WeatherData | null> {
  try {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (!data.daily) return null
    
    // Calculate averages over the trip period
    const temps = data.daily.temperature_2m_max || []
    const tempsMins = data.daily.temperature_2m_min || []
    const precip = data.daily.precipitation_sum || []
    const weatherCodes = data.daily.weathercode || []
    
    if (temps.length === 0) return null
    
    const avgMax = temps.reduce((a: number, b: number) => a + b, 0) / temps.length
    const avgMin = tempsMins.reduce((a: number, b: number) => a + b, 0) / tempsMins.length
    const totalPrecip = precip.reduce((a: number, b: number) => a + b, 0)
    const dominantWeatherCode = weatherCodes[0] || 0
    
    return {
      temperature: {
        min: Math.round(avgMin),
        max: Math.round(avgMax),
        avg: Math.round((avgMax + avgMin) / 2)
      },
      condition: getWeatherCondition(dominantWeatherCode),
      icon: getWeatherIcon(dominantWeatherCode),
      precipitation: Math.round(totalPrecip),
      humidity: 0 // Not included in free tier
    }
  } catch (error) {
    console.error('Weather forecast error:', error)
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
  const coords = await getCoordinates(location)
  if (!coords) return null
  
  return await getWeatherForecast(coords.latitude, coords.longitude, startDate, endDate)
}
