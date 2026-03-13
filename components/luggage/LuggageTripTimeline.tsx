'use client'

import { useState } from 'react'
import type { LuggageTripHistoryEntry } from '@/types/luggage'
import { format, isBefore, isAfter, startOfDay } from 'date-fns'

function formatDateRange(start: Date, end: Date): string {
  const startStr = format(start, 'MMM d')
  const endStr = format(end, 'MMM d, yyyy')

  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, 'MMM d, yyyy')} – ${endStr}`
  }
  return `${startStr} – ${endStr}`
}

function getTripStatus(start: Date, end: Date): 'upcoming' | 'in-progress' | 'completed' {
  const today = startOfDay(new Date())
  const startDate = startOfDay(start)
  const endDate = startOfDay(end)

  if (isBefore(endDate, today)) return 'completed'
  if (isAfter(startDate, today)) return 'upcoming'
  return 'in-progress'
}

export function LuggageTripTimeline({
  tripLuggages,
}: {
  tripLuggages: LuggageTripHistoryEntry[]
}) {
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set())

  if (tripLuggages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-xl border border-dashed border-muted">
        <p className="text-muted-foreground">
          No trips yet — add this bag to a trip to start tracking its history.
        </p>
      </div>
    )
  }

  const toggleTrip = (tripId: string) => {
    setExpandedTrips((prev) => {
      const next = new Set(prev)
      if (next.has(tripId)) next.delete(tripId)
      else next.add(tripId)
      return next
    })
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
      {tripLuggages.map((tl) => {
        const isExpanded = expandedTrips.has(tl.trip.id)
        const status = getTripStatus(tl.trip.startDate, tl.trip.endDate)
        const totalItems = tl.packingItems.length

        return (
          <div key={tl.trip.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-slate-200 group-[.is-active]:bg-foreground text-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 transform translate-x-0 md:-translate-x-1/2">
              <span className={`w-3 h-3 rounded-full ${status === 'upcoming' ? 'bg-blue-500' : status === 'in-progress' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-14 md:ml-0 p-4 rounded-xl border border-border bg-card shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{tl.trip.destination}</h3>
                  {tl.trip.name && (
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">({tl.trip.name})</span>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  status === 'in-progress' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {status === 'upcoming' ? 'Upcoming' : status === 'in-progress' ? 'In Progress' : 'Completed'}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {formatDateRange(tl.trip.startDate, tl.trip.endDate)}
              </p>

              <button
                onClick={() => toggleTrip(tl.trip.id)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-sm"
              >
                <span className="font-medium">{totalItems} items packed</span>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-border space-y-1">
                  {tl.packingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 text-center">No items packed</p>
                  ) : (
                    tl.packingItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1 px-2 text-sm hover:bg-muted/30 rounded">
                        <span className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${item.isPacked ? 'bg-foreground border-foreground text-background' : 'border-input'}`}>
                            {item.isPacked && <span className="text-[10px]">✓</span>}
                          </span>
                          <span className={item.isPacked ? 'line-through text-muted-foreground' : ''}>{item.name}</span>
                        </span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
