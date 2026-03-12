// In-memory cache for trip data to improve perceived loading performance

const tripCache = new Map<string, any>()
const weatherCache = new Map<string, any>()
const prefetchingTrips = new Set<string>()

export function setCachedTrip(id: string, trip: any) {
  tripCache.set(id, trip)
}

export function getCachedTrip(id: string): any {
  return tripCache.get(id)
}

export function setCachedWeather(id: string, weather: any) {
  weatherCache.set(id, weather)
}

export function getCachedWeather(id: string): any {
  return weatherCache.get(id)
}

export function isPrefetching(id: string): boolean {
  return prefetchingTrips.has(id)
}

export function startPrefetching(id: string) {
  prefetchingTrips.add(id)
}

export function finishPrefetching(id: string) {
  prefetchingTrips.delete(id)
}
