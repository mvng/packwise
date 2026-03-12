'use client'

import { useState } from 'react'

interface LaundryToggleProps {
  startDate: string
  endDate: string
  onChange?: (hasLaundry: boolean, midpoint: string | undefined) => void
}

export default function LaundryToggle({ startDate, endDate, onChange }: LaundryToggleProps) {
  const [hasLaundry, setHasLaundry] = useState(false)
  const [laundryDate, setLaundryDate] = useState<string>('')

  const handleToggle = (val: boolean) => {
    setHasLaundry(val)
    if (!val) {
      setLaundryDate('')
      onChange?.(false, undefined)
    } else {
      onChange?.(true, laundryDate || undefined)
    }
  }

  const handleDateChange = (val: string) => {
    setLaundryDate(val)
    onChange?.(hasLaundry, val || undefined)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧺</span>
          <div>
            <h3 className="font-semibold text-gray-900">Laundry Access</h3>
            <p className="text-xs text-gray-500">Reduce outfit count if you can do laundry mid-trip</p>
          </div>
        </div>
        <button
          onClick={() => handleToggle(!hasLaundry)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            hasLaundry ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          aria-pressed={hasLaundry}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              hasLaundry ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {hasLaundry && (
        <div className="mt-4">
          <label className="text-xs text-gray-500 block mb-1">Laundry date (mid-trip)</label>
          <input
            type="date"
            min={startDate}
            max={endDate}
            value={laundryDate}
            onChange={e => handleDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
          />
          {laundryDate && (
            <p className="text-xs text-green-600 mt-2">
              ✅ Outfit counts after {new Date(laundryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} are halved
            </p>
          )}
        </div>
      )}
    </div>
  )
}
