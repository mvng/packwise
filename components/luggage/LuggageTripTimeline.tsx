'use client'

import { useState } from 'react'
import type { LuggageTripHistoryEntry } from '@/types/luggage'

export default function LuggageTripTimeline({
  tripLuggages,
}: {
  tripLuggages: LuggageTripHistoryEntry[]
}) {
  const sortedTrips = [...tripLuggages].sort(
    (a, b) => new Date(b.trip.startDate).getTime() - new Date(a.trip.startDate).getTime()
  )

  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedTrips)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedTrips(newExpanded)
  }

  const getTripStatus = (startDate: Date, endDate: Date) => {
    const now = new Date()
    if (now < new Date(startDate)) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    } else if (now > new Date(endDate)) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' }
    } else {
      return { label: 'In Progress', color: 'bg-green-100 text-green-800' }
    }
  }

  const formatDateRange = (start: Date, end: Date) => {
    const dStart = new Date(start)
    const dEnd = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const startStr = dStart.toLocaleDateString(undefined, options)
    const endStr = dEnd.toLocaleDateString(undefined, options)
    const year = dEnd.getFullYear()
    return `${startStr} – ${endStr}, ${year}`
  }

  if (sortedTrips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">No trips yet</h3>
        <p className="text-gray-500 text-sm">Add this bag to a trip to start tracking its history.</p>
      </div>
    )
  }

  return (
    <div className="relative border-l-2 border-gray-200 ml-3 md:ml-4 pl-6 md:pl-8 space-y-8">
      {sortedTrips.map((entry) => {
        const status = getTripStatus(entry.trip.startDate, entry.trip.endDate)
        const isExpanded = expandedTrips.has(entry.id)
        const items = entry.packingItems

        return (
          <div key={entry.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-3 h-3 bg-white border-2 border-gray-300 rounded-full"></div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entry.trip.destination}
                    {entry.trip.name ? ` - ${entry.trip.name}` : ''}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateRange(entry.trip.startDate, entry.trip.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {items.length} items packed
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No items packed.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {item.isPacked ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span className="w-4"></span>
                              )}
                              <span className="text-gray-900">{item.name}</span>
                            </div>
                            <span className="text-gray-500 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                              x{item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
