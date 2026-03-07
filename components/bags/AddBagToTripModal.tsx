'use client'

import { useState, useTransition, useEffect } from 'react'
import { getUserBags, addBagToTrip, createAndAddBagToTrip } from '@/actions/bag.actions'

interface Bag {
  id: string
  name: string
  capacity?: string | null
  color?: string | null
}

interface TripBag {
  id: string
  bagId: string
  isBringing: boolean
  bag: Bag
}

interface AddBagToTripModalProps {
  tripId: string
  existingTripBagIds: string[]
  onClose: () => void
  onAdded: (tripBag: TripBag) => void
}

function getBagEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('backpack') || lower.includes('aer') || lower.includes('daypack')) return '🎒'
  if (lower.includes('trunk')) return '📦'
  if (lower.includes('duffel') || lower.includes('tote')) return '👜'
  return '🧳'
}

export default function AddBagToTripModal({
  tripId,
  existingTripBagIds,
  onClose,
  onAdded,
}: AddBagToTripModalProps) {
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'pick' | 'create'>('pick')
  const [newName, setNewName] = useState('')
  const [newCapacity, setNewCapacity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getUserBags().then((result) => {
      if ('bags' in result) setBags(result.bags)
      setLoading(false)
    })
  }, [])

  const availableBags = bags.filter((b) => !existingTripBagIds.includes(b.id))

  const handlePickBag = (bagId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await addBagToTrip(tripId, bagId)
      if ('error' in result) {
        setError(result.error)
      } else if (result.tripBag) {
        onAdded(result.tripBag as unknown as TripBag)
        onClose()
      }
    })
  }

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    setError(null)
    startTransition(async () => {
      const result = await createAndAddBagToTrip(
        tripId,
        name,
        newCapacity.trim() || undefined,
      )
      if ('error' in result) {
        setError(result.error)
      } else if (result.tripBag) {
        onAdded(result.tripBag as unknown as TripBag)
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Add Bag</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pick from your collection or add a new one</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setMode('pick')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'pick'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            My Bags
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            New Bag
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-4">{error}</div>
          )}

          {mode === 'pick' ? (
            loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : availableBags.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🧳</div>
                <p className="text-sm text-gray-500 mb-3">
                  {bags.length === 0
                    ? 'No bags in your collection yet.'
                    : 'All your bags are already on this trip.'}
                </p>
                <button
                  onClick={() => setMode('create')}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Create a new bag →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableBags.map((bag) => (
                  <button
                    key={bag.id}
                    onClick={() => handlePickBag(bag.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-xl">{getBagEmoji(bag.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{bag.name}</p>
                      {bag.capacity && (
                        <p className="text-xs text-gray-400">{bag.capacity}</p>
                      )}
                    </div>
                    <span className="text-xs text-blue-500 font-medium">Add →</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Bag name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20L Aer bag, Rimowa Check-in"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Size / type{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20L, Carry-on, Check-in, 45L"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isPending}
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Adding…' : 'Add to Trip'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
