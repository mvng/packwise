'use client'

import { useState, useTransition } from 'react'
import { addBagToTrip, removeBagFromTrip, assignItemToBag } from '@/actions/bags.actions'

const BAG_TYPES = [
  { value: 'backpack', label: 'Backpack', emoji: '🎒' },
  { value: 'carry-on', label: 'Carry-on', emoji: '🧳' },
  { value: 'check-in', label: 'Check-in', emoji: '🧳' },
  { value: 'duffel', label: 'Duffel', emoji: '👜' },
  { value: 'tote', label: 'Tote', emoji: '🛍️' },
  { value: 'personal', label: 'Personal item', emoji: '👝' },
  { value: 'trunk', label: 'Trunk', emoji: '🧳' },
  { value: 'other', label: 'Other', emoji: '🗃️' },
]

const getBagEmoji = (type: string) =>
  BAG_TYPES.find((t) => t.value === type)?.emoji ?? '🧳'

export interface TripBagItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  bagId: string | null
  category: { name: string }
}

export interface TripBagEntry {
  id: string
  bag: {
    id: string
    name: string
    type: string
    capacity: string | null
    color: string | null
  }
  packingItems: TripBagItem[]
}

export interface OwnedBag {
  id: string
  name: string
  type: string
  capacity: string | null
}

interface Props {
  tripId: string
  tripBags: TripBagEntry[]
  ownedBags: OwnedBag[]
  allItems: TripBagItem[]
}

export default function TripBagsSection({ tripId, tripBags: initialTripBags, ownedBags, allItems }: Props) {
  const [tripBags, setTripBags] = useState<TripBagEntry[]>(initialTripBags)
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Bags the user owns but hasn't added to this trip yet
  const addableBags = ownedBags.filter(
    (ob) => !tripBags.some((tb) => tb.bag.id === ob.id)
  )

  // All packing items not yet assigned to any bag on this trip
  const unassignedItems = allItems.filter((item) => !item.bagId)

  const handleAddBag = (bagId: string) => {
    startTransition(async () => {
      setError(null)
      const result = await addBagToTrip(tripId, bagId)
      if (result.error) { setError(result.error); return }
      if (result.tripBag) {
        setTripBags((prev) => [
          ...prev,
          { ...result.tripBag!, packingItems: [] },
        ])
      }
      setShowPicker(false)
    })
  }

  const handleRemoveBag = (tripBagId: string) => {
    startTransition(async () => {
      setError(null)
      const result = await removeBagFromTrip(tripId, tripBagId)
      if (result.error) { setError(result.error); return }
      setTripBags((prev) => prev.filter((tb) => tb.id !== tripBagId))
    })
  }

  const handleAssign = (itemId: string, tripBagId: string | null) => {
    startTransition(async () => {
      setError(null)
      await assignItemToBag(itemId, tripBagId, tripId)
      // Refresh is handled by revalidatePath in the action; optimistic update below
      setTripBags((prev) =>
        prev.map((tb) => ({
          ...tb,
          packingItems: tripBagId === tb.id
            ? tb.packingItems.some((i) => i.id === itemId)
              ? tb.packingItems
              : [...tb.packingItems, allItems.find((i) => i.id === itemId)!]
            : tb.packingItems.filter((i) => i.id !== itemId),
        }))
      )
    })
  }

  if (ownedBags.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <div className="text-3xl mb-3">🧳</div>
        <p className="text-sm text-gray-500 mb-3">No bags in your inventory yet.</p>
        <a
          href="/inventory/bags"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage my bags →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Trip bags */}
      {tripBags.map((tb) => (
        <div key={tb.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Bag header */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getBagEmoji(tb.bag.type)}</span>
              <div>
                <span className="font-medium text-gray-900 text-sm">{tb.bag.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {tb.bag.capacity && (
                    <span className="text-xs text-gray-400">{tb.bag.capacity}</span>
                  )}
                  {tb.bag.color && (
                    <span className="text-xs text-gray-400">{tb.bag.color}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {tb.packingItems.length} item{tb.packingItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRemoveBag(tb.id)}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Remove
            </button>
          </div>

          {/* Assigned items */}
          <div className="px-5 py-3">
            {tb.packingItems.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-1">No items assigned yet</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {tb.packingItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <span className={`flex-1 text-sm ${
                      item.isPacked ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}>
                      {item.quantity > 1 && (
                        <span className="font-medium mr-1">{item.quantity}x</span>
                      )}
                      {item.name}
                      <span className="text-xs text-gray-400 ml-1">· {item.category.name}</span>
                    </span>
                    <button
                      onClick={() => handleAssign(item.id, null)}
                      className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Unassign from bag"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assign unassigned items to this bag */}
            {unassignedItems.length > 0 && (
              <details className="group">
                <summary className="text-xs text-blue-500 hover:text-blue-700 font-medium cursor-pointer list-none">
                  + Assign items to this bag
                  <span className="text-gray-400 font-normal ml-1">
                    ({unassignedItems.length} unassigned)
                  </span>
                </summary>
                <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-100">
                  {unassignedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAssign(item.id, tb.id)}
                      className="w-full text-left text-xs text-gray-600 hover:text-blue-600 py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                    >
                      {item.quantity > 1 && <span className="font-medium mr-1">{item.quantity}x</span>}
                      {item.name}
                      <span className="text-gray-400 ml-1">· {item.category.name}</span>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      ))}

      {/* Add bag picker */}
      {addableBags.length > 0 && (
        <div>
          {showPicker ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Choose a bag to add
              </p>
              <div className="space-y-2">
                {addableBags.map((bag) => (
                  <button
                    key={bag.id}
                    onClick={() => handleAddBag(bag.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-xl">{getBagEmoji(bag.type)}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{bag.name}</span>
                    {bag.capacity && (
                      <span className="text-xs text-gray-400">{bag.capacity}</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full text-sm px-4 py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 rounded-2xl font-medium transition-colors"
            >
              + Add a bag to this trip
            </button>
          )}
        </div>
      )}

      {/* All bags used — prompt to manage */}
      {addableBags.length === 0 && tripBags.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          All your bags are on this trip ·{' '}
          <a href="/inventory/bags" className="text-blue-500 hover:text-blue-700">
            Manage bags
          </a>
        </p>
      )}
    </div>
  )
}
