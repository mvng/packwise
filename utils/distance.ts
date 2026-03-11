// Uses Open-Meteo Geocoding API + Haversine formula
// Cache results in a module-level Map to avoid duplicate API calls per session

const geocodeCache = new Map<string, { lat: number; lon: number } | null>()

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  if (geocodeCache.has(city)) return geocodeCache.get(city)!
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    )
    const data = await res.json()
    const result = data.results?.[0]
      ? { lat: data.results[0].latitude, lon: data.results[0].longitude }
      : null
    geocodeCache.set(city, result)
    return result
  } catch {
    geocodeCache.set(city, null)
    return null
  }
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

export async function calculateRoundTripKm(homeCity: string, destination: string): Promise<number> {
  const [home, dest] = await Promise.all([geocodeCity(homeCity), geocodeCity(destination)])
  if (!home || !dest) return 0
  return Math.round(haversineKm(home, dest) * 2) // round-trip
}

export function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km} km`
}
