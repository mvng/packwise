'use client'

import { useState, useEffect } from 'react'
import { getUserLuggage, getTripLuggage, addLuggageToTrip, removeLuggageFromTrip } from '@/actions/luggage.actions'
import type { Luggage, TripLuggage, LuggageType } from '@/types/luggage'
import Link from 'next/link'

interface Props {
  tripId: string
}

export default function TripLuggageSelector({ tripId }: Props) {
  const [allLuggage, setAllLuggage] = useState<Luggage[]>([])
  const [selectedLuggage, setSelectedLuggage] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const luggageIcons: Record<LuggageType, string> = {
    backpack: '🎒',
    'carry-on': '🧳',
    checked: '💼',
    trunk: '📦',
    other: '👜',
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [allResult, tripResult] = await Promise.all([
      getUserLuggage(),
      getTripLuggage(tripId),
    ])

    if (allResult.luggage) {
      setAllLuggage(allResult.luggage as Luggage[])
    }

    if (tripResult.tripLuggages) {
      const activeLuggageIds = new Set(
        tripResult.tripLuggages.map((tl: any) => tl.luggageId)
      )
      setSelectedLuggage(activeLuggageIds)
    }
    setLoading(false)
  }

  async function toggleLuggage(luggageId: string) {
    const isSelected = selectedLuggage.has(luggageId)

    if (isSelected) {
      await removeLuggageFromTrip(tripId, luggageId)
      setSelectedLuggage((prev) => {
        const next = new Set(prev)
        next.delete(luggageId)
        return next
      })
    } else {
      await addLuggageToTrip(tripId, luggageId)
      setSelectedLuggage((prev) => new Set(prev).add(luggageId))
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="animate-pulse">Loading luggage...</div>
      </div>
    )
  }

  if (allLuggage.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🧳</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">No luggage yet</h3>
            <p className="text-sm text-gray-500 mb-3">
              Add your bags to choose which ones you're bringing on this trip
            </p>
            <Link
              href="/luggage"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Add Luggage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Luggage for this trip</h3>
        <Link href="/luggage" className="text-sm text-blue-600 hover:text-blue-700">
          Manage →
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Select which bags you're bringing
      </p>
      <div className="space-y-2">
        {allLuggage.map((item) => {
          const isSelected = selectedLuggage.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => toggleLuggage(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white m-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="text-2xl">{luggageIcons[item.type as LuggageType]}</div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {item.type}
                  {item.capacity && ` • ${item.capacity}L`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
