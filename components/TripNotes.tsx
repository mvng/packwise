'use client'

import { useState, useEffect } from 'react'
import { updateTrip } from '@/actions/trip.actions'
import { Check } from 'lucide-react'

interface TripNotesProps {
  tripId: string
  initialNotes: string | null
  readOnly: boolean
}

export default function TripNotes({ tripId, initialNotes, readOnly }: TripNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  // Sync state if initialNotes changes from a parent re-render
  useEffect(() => {
    setNotes(initialNotes || '')
  }, [initialNotes])

  const handleBlur = async () => {
    const trimmedNotes = notes.trim()
    const previousNotes = initialNotes || ''

    // Only save if it actually changed
    if (trimmedNotes === previousNotes) return

    setIsSaving(true)
    const result = await updateTrip(tripId, { notes: trimmedNotes || null })
    setIsSaving(false)

    if (result?.success) {
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }
  }

  if (readOnly) {
    if (!notes) return null

    return (
      <div className="mt-5 pt-5 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Trip Notes</h3>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {notes}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Trip Notes</h3>
        <div className="flex items-center gap-3">
          {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          <span className={`text-xs ${notes.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
            {notes.length} / 500
          </span>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        maxLength={500}
        rows={3}
        placeholder="Any additional details or free-form notes for this trip..."
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-800 transition-shadow"
      />
    </div>
  )
}
