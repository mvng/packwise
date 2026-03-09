'use client'

import { useState } from 'react'
import OutfitPlanner, { calcOutfitSummary, OutfitSummary, DayActivity } from './OutfitPlanner'
import LaundryToggle from './LaundryToggle'
import LuggageFitCheck from './LuggageFitCheck'
import SmartOutfitSuggestions from './SmartOutfitSuggestions'
import OutfitItemAssigner, { AssignableItem, ItemOutfitAssignment } from './OutfitItemAssigner'
import DayViewModal from './DayViewModal'

interface TripLuggage {
  luggage: {
    name: string
    capacityLiters?: number | null
  }
}

interface OutfitPlannerPanelProps {
  tripId: string
  startDate: string
  endDate: string
  tripLuggages?: TripLuggage[]
  avgTempF?: number
  tripType?: string
  packingItems?: AssignableItem[]
}

export default function OutfitPlannerPanel({
  tripId,
  startDate,
  endDate,
  tripLuggages = [],
  avgTempF,
  tripType,
  packingItems = [],
}: OutfitPlannerPanelProps) {
  const [days, setDays] = useState<DayActivity[]>([])
  const [hasLaundry, setHasLaundry] = useState(false)
  const [laundryMidpoint, setLaundryMidpoint] = useState<string | undefined>()
  const [assignments, setAssignments] = useState<Record<string, ItemOutfitAssignment>>({})
  const [showDayView, setShowDayView] = useState(false)

  const outfitSummary: OutfitSummary = days.length > 0
    ? calcOutfitSummary(days, hasLaundry, laundryMidpoint)
    : { casual: 0, outdoor: 0, formal: 0, underwear: 0, totalDays: 0 }

  const luggages = tripLuggages
    .filter(tl => tl.luggage.capacityLiters)
    .map(tl => ({ name: tl.luggage.name, capacityLiters: tl.luggage.capacityLiters! }))

  const handleAssignmentsChange = (list: ItemOutfitAssignment[]) => {
    const map: Record<string, ItemOutfitAssignment> = {}
    list.forEach(a => { map[a.itemId] = a })
    setAssignments(map)
  }

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

      {days.length > 0 && packingItems.length > 0 && (
        <>
          <OutfitItemAssigner
            tripId={tripId}
            items={packingItems}
            days={days}
            hasLaundry={hasLaundry}
            laundryMidpoint={laundryMidpoint}
            onAssignmentsChange={handleAssignmentsChange}
          />

          <button
            onClick={() => setShowDayView(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            \ud83d\uddd3\ufe0f View Day-by-Day Outfit Plan
          </button>
        </>
      )}

      {outfitSummary.totalDays > 0 && (
        <>
          {luggages.length > 0 && (
            <LuggageFitCheck luggages={luggages} outfits={outfitSummary} />
          )}
          <SmartOutfitSuggestions
            outfits={outfitSummary}
            avgTempF={avgTempF}
            tripType={tripType}
          />
        </>
      )}

      {showDayView && (
        <DayViewModal
          days={days}
          items={packingItems}
          assignments={assignments}
          hasLaundry={hasLaundry}
          laundryMidpoint={laundryMidpoint}
          onClose={() => setShowDayView(false)}
        />
      )}
    </div>
  )
}
