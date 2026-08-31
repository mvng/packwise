'use client'

import { useState, useRef } from 'react'
import { Check } from 'lucide-react'
import { updateTrip } from '@/actions/trip.actions'

interface TripNotesProps {
  tripId: string
  initialNotes: string | null
  readOnly: boolean
}

const MAX_NOTES_LENGTH = 500

export default function TripNotes({ tripId, initialNotes, readOnly }: TripNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [lastSavedNotes, setLastSavedNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)

  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleBlur = async () => {
    if (readOnly) return
    const trimmedNotes = notes.trim()
    if (trimmedNotes === lastSavedNotes) return

    setIsSaving(true)
    const result = await updateTrip(tripId, { notes: trimmedNotes || null })

    // Only update state if the component hasn't been unmounted or heavily modified
    setIsSaving(false)

    if (result.success) {
      setLastSavedNotes(trimmedNotes)
      setShowSavedIndicator(true)

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }

      savedTimeoutRef.current = setTimeout(() => {
        setShowSavedIndicator(false)
      }, 2000)
    }
    // Note: Do not revert `notes` automatically on failure if the user kept typing.
    // They will just remain out of sync until the next successful blur.
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotes(value)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trip Notes</h2>

        {!readOnly && (
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                Saving...
              </span>
            )}
            {!isSaving && showSavedIndicator && (
              <span className="text-xs text-green-600 flex items-center gap-1 font-medium transition-opacity duration-300">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            <span className={`text-xs ${notes.length >= MAX_NOTES_LENGTH ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {notes.length} / {MAX_NOTES_LENGTH}
            </span>
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 min-h-[100px] whitespace-pre-wrap border border-gray-100">
          {notes || <span className="text-gray-400 italic">No notes provided for this trip.</span>}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Jot down important details, flight numbers, or random ideas..."
          className="w-full h-32 p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors resize-y"
        />
      )}
    </div>
  )
}
