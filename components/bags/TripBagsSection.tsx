'use client'

import { useState, useTransition } from 'react'
import { updateTripBagBringing, removeBagFromTrip } from '@/actions/bag.actions'
import AddBagToTripModal from './AddBagToTripModal'

interface Bag {
  id: string
  name: string
  color?: string | null
  capacity?: string | null
}

interface TripBag {
  id: string
  bagId: string
  isBringing: boolean
  bag: Bag
}

interface TripBagsSectionProps {
  tripId: string
  initialTripBags: TripBag[]
}

function getBagEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('backpack') || lower.includes('aer') || lower.includes('daypack')) return '🎒'
  if (lower.includes('trunk')) return '📦'
  if (lower.includes('duffel') || lower.includes('tote')) return '👜'
  return '🧳'
}

export default function TripBagsSection({ tripId, initialTripBags }: TripBagsSectionProps) {
  const [tripBags, setTripBags] = useState(initialTripBags)
  const [showAddModal, setShowAddModal] = useState(false)
  const [, startTransition] = useTransition()

  const bringing = tripBags.filter((tb) => tb.isBringing)
  const notBringing = tripBags.filter((tb) => !tb.isBringing)

  const handleToggleBringing = (tripBagId: string, current: boolean) => {
    setTripBags((prev) =>
      prev.map((tb) => (tb.id === tripBagId ? { ...tb, isBringing: !current } : tb))
    )
    startTransition(async () => {
      await updateTripBagBringing(tripBagId, !current, tripId)
    })
  }

  const handleRemove = (tripBagId: string) => {
    setTripBags((prev) => prev.filter((tb) => tb.id !== tripBagId))
    startTransition(async () => {
      await removeBagFromTrip(tripBagId, tripId)
    })
  }

  const handleBagAdded = (newTripBag: TripBag) => {
    setTripBags((prev) => [...prev, newTripBag])
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Bags & Luggage</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {bringing.length} bringing
            {notBringing.length > 0 && ` · ${notBringing.length} not bringing`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          + Add bag
        </button>
      </div>

      {tripBags.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="text-3xl mb-2">🧳</div>
          <p className="text-sm text-gray-500 mb-3">No bags added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            Add your first bag →
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {bringing.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Bringing
              </p>
              <div className="space-y-2">
                {bringing.map((tb) => (
                  <BagRow
                    key={tb.id}
                    tripBag={tb}
                    onToggle={handleToggleBringing}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
          {notBringing.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Not Bringing
              </p>
              <div className="space-y-2">
                {notBringing.map((tb) => (
                  <BagRow
                    key={tb.id}
                    tripBag={tb}
                    onToggle={handleToggleBringing}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddBagToTripModal
          tripId={tripId}
          existingTripBagIds={tripBags.map((tb) => tb.bagId)}
          onClose={() => setShowAddModal(false)}
          onAdded={handleBagAdded}
        />
      )}
    </div>
  )
}

function BagRow({
  tripBag,
  onToggle,
  onRemove,
}: {
  tripBag: TripBag
  onToggle: (id: string, current: boolean) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xl flex-shrink-0">{getBagEmoji(tripBag.bag.name)}</span>
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium ${
            tripBag.isBringing ? 'text-gray-800' : 'text-gray-400 line-through'
          }`}
        >
          {tripBag.bag.name}
        </span>
        {tripBag.bag.capacity && (
          <span className="ml-2 text-xs text-gray-400">{tripBag.bag.capacity}</span>
        )}
      </div>
      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(tripBag.id, tripBag.isBringing)}
          className="text-xs text-gray-400 hover:text-blue-500 font-medium whitespace-nowrap transition-colors"
        >
          {tripBag.isBringing ? 'Not bringing' : 'Mark bringing'}
        </button>
        <button
          onClick={() => onRemove(tripBag.id)}
          className="text-red-400 hover:text-red-600 text-sm leading-none transition-colors"
          aria-label="Remove bag"
        >
          ×
        </button>
      </div>
    </div>
  )
}
