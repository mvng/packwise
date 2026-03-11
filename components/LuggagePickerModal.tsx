'use client'

import { useState, useEffect } from 'react'
import { getUserLuggage, addLuggageToTrip, createLuggage } from '@/actions/luggage.actions'
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

const luggageTypes: { value: LuggageType; label: string }[] = [
  { value: 'backpack', label: 'Backpack' },
  { value: 'carry-on', label: 'Carry-on' },
  { value: 'checked', label: 'Checked Bag' },
  { value: 'trunk', label: 'Trunk' },
  { value: 'other', label: 'Other' },
]

const emojiOptions = [
  '🎒', '🧳', '💼', '📦', '👜',
  '🛍️', '🎒', '👝', '👑', '👒',
  '✈️', '🏝️', '🏖️', '🏕️', '⛰️',
  '🏋️', '⚽', '🎾', '🎸', '📷',
]

export default function LuggagePickerModal({ tripId, onClose, onSuccess }: Props) {
  const [luggage, setLuggage] = useState<Luggage[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLuggage, setNewLuggage] = useState({ name: '', type: 'backpack' as LuggageType, icon: '', capacity: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

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
      await addLuggageToTrip(tripId, luggageId)
    }
    onSuccess()
  }

  const handleCreateLuggage = async () => {
    if (!newLuggage.name.trim()) {
      setCreateError('Please enter a name')
      return
    }

    setCreating(true)
    setCreateError(null)

    const result = await createLuggage({
      name: newLuggage.name.trim(),
      type: newLuggage.type,
      icon: newLuggage.icon || undefined,
      capacity: newLuggage.capacity ? parseInt(newLuggage.capacity) : undefined,
    })

    setCreating(false)

    if (result.error) {
      setCreateError(result.error)
      return
    }

    if (result.luggage) {
      // Add to trip immediately
      await addLuggageToTrip(tripId, result.luggage.id)
      onSuccess()
    }
  }

  const getDisplayIcon = (item: Luggage) => {
    return item.icon || luggageIcons[item.type as LuggageType]
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
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateForm ? 'Create new luggage' : 'Add luggage to trip'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {showCreateForm ? 'Add a new bag to your inventory' : 'Select bags you\'ll be bringing'}
              </p>
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
            {showCreateForm ? (
              <div className="space-y-4">
                {createError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bag name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLuggage.name}
                    onChange={(e) => setNewLuggage({ ...newLuggage, name: e.target.value })}
                    placeholder="e.g., My Backpack, Blue Suitcase"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {luggageTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewLuggage({ ...newLuggage, type: type.value })}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          newLuggage.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-2xl">{luggageIcons[type.value]}</span>
                        <span className="text-sm font-medium text-gray-700">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Icon <span className="text-gray-400 text-xs">optional</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
                    >
                      <span className="text-2xl">{newLuggage.icon || luggageIcons[newLuggage.type]}</span>
                      <span className="text-sm text-gray-600">Change icon</span>
                    </button>
                    {newLuggage.icon && (
                      <button
                        type="button"
                        onClick={() => setNewLuggage({ ...newLuggage, icon: '' })}
                        className="px-4 py-3 text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {showEmojiPicker && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl grid grid-cols-10 gap-2">
                      {emojiOptions.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewLuggage({ ...newLuggage, icon: emoji })
                            setShowEmojiPicker(false)
                          }}
                          className="text-2xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (liters) <span className="text-gray-400 text-xs">optional</span>
                  </label>
                  <input
                    type="number"
                    value={newLuggage.capacity}
                    onChange={(e) => setNewLuggage({ ...newLuggage, capacity: e.target.value })}
                    placeholder="e.g., 40"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-gray-400">Loading your luggage...</div>
            ) : (
              <>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all mb-4"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new luggage
                </button>

                {luggage.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🎒</div>
                    <p className="text-gray-500">No luggage in your inventory yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Create your first bag above!</p>
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
                          <div className="text-3xl">{getDisplayIcon(item)}</div>
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            {showCreateForm ? (
              <>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateError(null)
                    setNewLuggage({ name: '', type: 'backpack', icon: '', capacity: '' })
                    setShowEmojiPicker(false)
                  }}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                  disabled={creating}
                >
                  Back
                </button>
                <button
                  onClick={handleCreateLuggage}
                  disabled={creating || !newLuggage.name.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {creating ? 'Creating...' : 'Create & Add to Trip'}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
