'use client'

import { useState } from 'react'
import OutfitPlanner, { calcOutfitSummary, OutfitSummary, DayActivity } from './OutfitPlanner'
import LaundryToggle from './LaundryToggle'
import LuggageFitCheck from './LuggageFitCheck'
import SmartOutfitSuggestions from './SmartOutfitSuggestions'

interface TripLuggage {
  luggage: {
    name: string
    capacityLiters?: number | null
  }
}

interface OutfitPlannerPanelProps {
  startDate: string
  endDate: string
  tripLuggages?: TripLuggage[]
  avgTempF?: number
  tripType?: string
}

export default function OutfitPlannerPanel({
  startDate,
  endDate,
  tripLuggages = [],
  avgTempF,
  tripType,
}: OutfitPlannerPanelProps) {
  const [days, setDays] = useState<DayActivity[]>([])
  const [hasLaundry, setHasLaundry] = useState(false)
  const [laundryMidpoint, setLaundryMidpoint] = useState<string | undefined>()

  const outfitSummary: OutfitSummary = days.length > 0
    ? calcOutfitSummary(days, hasLaundry, laundryMidpoint)
    : { casual: 0, outdoor: 0, formal: 0, underwear: 0, totalDays: 0 }

  const luggages = tripLuggages
    .filter(tl => tl.luggage.capacityLiters)
    .map(tl => ({ name: tl.luggage.name, capacityLiters: tl.luggage.capacityLiters! }))

  return (
    <div className="space-y-4">
      <OutfitPlanner
        startDate={startDate}
        endDate={endDate}
        onChange={setDays}
      />
      <LaundryToggle
        startDate={startDate}
        endDate={endDate}
        onChange={(laundry, midpoint) => {
          setHasLaundry(laundry)
          setLaundryMidpoint(midpoint)
        }}
      />
      {outfitSummary.totalDays > 0 && (
        <>
          {luggages.length > 0 && (
            <LuggageFitCheck
              luggages={luggages}
              outfits={outfitSummary}
            />
          )}
          <SmartOutfitSuggestions
            outfits={outfitSummary}
            avgTempF={avgTempF}
            tripType={tripType}
          />
        </>
      )}
    </div>
  )
}
