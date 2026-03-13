'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { LuggageTripHistoryEntry } from '@/types/luggage'
import { calculateRoundTripKm, formatDistance } from '@/utils/distance'

export function LuggageHistoryStats({
  tripLuggages,
  homeCity,
}: {
  tripLuggages: LuggageTripHistoryEntry[]
  homeCity: string | null
}) {
  const [distance, setDistance] = useState<number | null>(null)
  const [isLoadingDistance, setIsLoadingDistance] = useState(true)

  const totalTrips = tripLuggages.length

  const totalItems = new Set(
    tripLuggages.flatMap((tl) => tl.packingItems.map((item) => item.name.toLowerCase()))
  ).size

  useEffect(() => {
    async function fetchDistance() {
      if (!homeCity) {
        setIsLoadingDistance(false)
        return
      }

      const uniqueDestinations = Array.from(
        new Set(tripLuggages.map((tl) => tl.trip.destination))
      )

      let totalKm = 0
      for (const dest of uniqueDestinations) {
        totalKm += await calculateRoundTripKm(homeCity, dest)
      }

      setDistance(totalKm)
      setIsLoadingDistance(false)
    }

    fetchDistance()
  }, [tripLuggages, homeCity])

  return (
    <div className="flex flex-wrap gap-4 mt-6 mb-8">
      <div className="flex-1 min-w-[120px] p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground font-medium mb-1">Trips</p>
        <p className="text-2xl font-bold">{totalTrips}</p>
      </div>

      <div className="flex-1 min-w-[140px] p-4 bg-muted rounded-xl">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-sm text-muted-foreground font-medium">Distance</p>
        </div>
        {isLoadingDistance ? (
          <div className="h-8 w-24 bg-foreground/10 animate-pulse rounded" />
        ) : homeCity ? (
          <p className="text-2xl font-bold" title="Estimated round-trip distance from home city">
            {distance ? formatDistance(distance) : '0 km'}
          </p>
        ) : (
          <div>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
            <Link href="/settings" className="text-xs text-primary hover:underline mt-1 block">
              Set home city in settings
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[140px] p-4 bg-muted rounded-xl">
        <p className="text-sm text-muted-foreground font-medium mb-1">Items packed</p>
        <p className="text-2xl font-bold">{totalItems}</p>
      </div>
    </div>
  )
}
