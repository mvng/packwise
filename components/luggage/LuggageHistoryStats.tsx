'use client'

import { useState, useEffect } from 'react'
import type { LuggageTripHistoryEntry } from '@/types/luggage'
import { calculateRoundTripKm, formatDistance } from '@/utils/distance'

export default function LuggageHistoryStats({
  trips,
  homeCity,
}: {
  trips: LuggageTripHistoryEntry[]
  homeCity: string | null
}) {
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDistance() {
      if (!homeCity) {
        setDistance(null)
        setLoading(false)
        return
      }

      // Deduplicate destinations to avoid redundant calculations
      // Actually we need to calculate round trip for each trip, so if they go to the same destination twice, it counts twice.
      let totalKm = 0
      for (const t of trips) {
        totalKm += await calculateRoundTripKm(homeCity, t.trip.destination)
      }

      setDistance(totalKm)
      setLoading(false)
    }

    loadDistance()
  }, [trips, homeCity])

  const tripCount = trips.length

  // Calculate unique packing items across all trips
  const uniqueItems = new Set()
  for (const t of trips) {
    for (const item of t.packingItems) {
      uniqueItems.add(item.name.toLowerCase())
    }
  }
  const itemCount = uniqueItems.size

  return (
    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
      <div className="flex flex-col bg-white border border-gray-100 rounded-xl p-4 min-w-[120px] shadow-sm">
        <span className="text-sm font-medium text-gray-500 mb-1">Trips</span>
        <span className="text-2xl font-bold text-gray-900">{tripCount}</span>
      </div>

      <div className="flex flex-col bg-white border border-gray-100 rounded-xl p-4 min-w-[120px] shadow-sm">
        <span className="text-sm font-medium text-gray-500 mb-1">Distance</span>
        {loading ? (
          <div className="h-8 bg-gray-200 animate-pulse rounded w-16"></div>
        ) : (
          <span
            className="text-2xl font-bold text-gray-900"
            title={homeCity ? `Estimated based on round trips from ${homeCity}` : undefined}
          >
            {distance !== null ? formatDistance(distance) : '—'}
          </span>
        )}
        {!homeCity && !loading && (
          <span className="text-xs text-gray-400 mt-1">Set home city in settings</span>
        )}
      </div>

      <div className="flex flex-col bg-white border border-gray-100 rounded-xl p-4 min-w-[120px] shadow-sm">
        <span className="text-sm font-medium text-gray-500 mb-1">Items packed</span>
        <span className="text-2xl font-bold text-gray-900">{itemCount}</span>
      </div>
    </div>
  )
}
