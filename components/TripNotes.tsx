'use client'

import { useState } from 'react'
import { updateTrip } from '@/actions/trip.actions'
import { CheckCircle2 } from 'lucide-react'

interface TripNotesProps {
  tripId: string
  initialNotes: string | null
  readOnly?: boolean
}

export default function TripNotes({ tripId, initialNotes, readOnly = false }: TripNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [lastSavedNotes, setLastSavedNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const MAX_CHARS = 500

  const handleBlur = async () => {
    if (readOnly || notes === lastSavedNotes) return

    setIsSaving(true)
    try {
      await updateTrip(tripId, { notes })
      setLastSavedNotes(notes)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (readOnly) {
    if (!initialNotes) return null
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📝</span> Trip Notes
        </h3>
        <p className="text-gray-700 whitespace-pre-wrap">{initialNotes}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>📝</span> Trip Notes
        </h3>
        <div className="flex items-center gap-3">
          {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1 transition-opacity">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          <span className={`text-xs ${notes.length >= MAX_CHARS ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {notes.length} / {MAX_CHARS}
          </span>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, MAX_CHARS))}
        onBlur={handleBlur}
        placeholder="Add any notes, booking references, or reminders for this trip..."
        className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-sm text-gray-700 placeholder:text-gray-400"
      />
    </div>
  )
}
