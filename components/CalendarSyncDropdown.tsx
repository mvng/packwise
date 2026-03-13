'use client'

import { useState, useRef, useEffect } from 'react'

interface CalendarSyncDropdownProps {
  tripId: string
}

export default function CalendarSyncDropdown({ tripId }: CalendarSyncDropdownProps) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false)
  const calendarMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(event.target as Node)) {
        setShowCalendarMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={calendarMenuRef}>
      <button
        onClick={() => setShowCalendarMenu(!showCalendarMenu)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        title="Calendar Sync"
      >
        <span>📅</span>
        <span className="hidden sm:inline">Add to Calendar</span>
      </button>

      {showCalendarMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Auto-updating</h3>
          </div>
          <a
            href={typeof window !== 'undefined' ? `webcal://${window.location.host}/api/calendar/${tripId}` : `/api/calendar/${tripId}`}
            className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100"
            onClick={() => setShowCalendarMenu(false)}
          >
            <div className="font-medium mb-0.5">Subscribe to Calendar (webcal)</div>
            <div className="text-xs text-gray-500">Apple Calendar, Outlook. Syncs packing progress!</div>
          </a>

          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">One-time Export</h3>
          </div>
          <a
            href={`/api/calendar/${tripId}`}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => setShowCalendarMenu(false)}
          >
            Download .ics file
          </a>
        </div>
      )}
    </div>
  )
}
