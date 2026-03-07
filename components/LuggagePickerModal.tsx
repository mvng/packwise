'use client'

import { useState, useEffect } from 'react'
import { getUserLuggage } from '@/actions/luggage.actions'
import { addTripLuggage } from '@/actions/luggage.actions'
import type { Luggage, LuggageType } from '@/types/luggage'

interface Props {
  tripId: string
  onClose: () => void
  onSuccess: () => void
}

const luggageIcons: Record<LuggageType, string> = {
  backpack: '🎒',
  'carry-on': '🧳',
  checked: '💼',
  trunk: '📦',
  other: '👜',
}

export default function LuggagePickerModal({ tripId, onClose, onSuccess }: Props) {
  const [luggage, setLuggage] = useState<Luggage[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLuggage()
  }, [])

  async function loadLuggage() {
    const result = await getUserLuggage()
    if (result.luggage) {
      setLuggage(result.luggage as Luggage[])
    }
    setLoading(false)
  }

  const toggleSelection = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAdd = async () => {
    for (const luggageId of selected) {
      await addTripLuggage(tripId, luggageId)
    }
    onSuccess()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add luggage to trip</h2>
              <p className="text-sm text-gray-500 mt-1">Select bags you'll be bringing</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading your luggage...</div>
            ) : luggage.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎒</div>
                <p className="text-gray-500">No luggage in your inventory yet.</p>
                <p className="text-sm text-gray-400 mt-2">Create luggage items first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {luggage.map((item) => {
                  const isSelected = selected.has(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSelection(item.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-3xl">{luggageIcons[item.type as LuggageType]}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {item.type}
                          {item.capacity && ` • ${item.capacity}L`}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add {selected.size > 0 && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
