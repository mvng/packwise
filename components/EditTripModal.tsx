'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { updateTrip } from '@/actions/trip.actions'

const LAUNDRY_STORAGE_KEY = (tripId: string) => `packwise_laundry_${tripId}`

export interface LaundrySettings {
  hasLaundry: boolean
  laundryDate: string
}

export function getLaundrySettings(tripId: string): LaundrySettings {
  if (typeof window === 'undefined') return { hasLaundry: false, laundryDate: '' }
  try {
    const saved = localStorage.getItem(LAUNDRY_STORAGE_KEY(tripId))
    return saved ? JSON.parse(saved) : { hasLaundry: false, laundryDate: '' }
  } catch {
    return { hasLaundry: false, laundryDate: '' }
  }
}

function saveLaundrySettings(tripId: string, settings: LaundrySettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAUNDRY_STORAGE_KEY(tripId), JSON.stringify(settings))
}

const COUNTRIES = [
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'France', 'Germany',
  'Italy', 'Spain', 'Japan', 'China', 'Australia', 'New Zealand', 'Brazil',
  'Argentina', 'India', 'South Korea', 'Thailand', 'Vietnam', 'Singapore',
  'Malaysia', 'Indonesia', 'Philippines', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Portugal', 'Greece', 'Turkey', 'Egypt', 'South Africa', 'Kenya',
  'Morocco', 'United Arab Emirates', 'Israel', 'Russia', 'Poland', 'Czech Republic',
  'Hungary', 'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'Ireland',
  'Croatia', 'Chile', 'Peru', 'Colombia', 'Costa Rica',
].sort()

interface EditTripModalProps {
  trip: {
    id: string
    name: string | null
    destination: string | null
    startDate: Date | string | null
    endDate: Date | string | null
    tripType: string | null
    notes: string | null
    hotelConfirmationUrl?: string | null
  }
  onClose: () => void
  onSuccess: () => void
}

export default function EditTripModal({ trip, onClose, onSuccess }: EditTripModalProps) {
  const parseDestination = (dest: string | null) => {
    if (!dest) return { city: '', country: 'United States' }
    const parts = dest.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      const country = parts[parts.length - 1]
      const city = parts.slice(0, -1).join(', ')
      return { city, country }
    }
    return { city: dest, country: 'United States' }
  }

  const { city, country } = parseDestination(trip.destination)
  const savedLaundry = getLaundrySettings(trip.id)

  const startDateStr = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : ''
  const endDateStr = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : ''

  const [formData, setFormData] = useState({
    name: trip.name || '',
    city,
    country,
    startDate: startDateStr,
    endDate: endDateStr,
    tripType: trip.tripType || 'leisure',
    notes: trip.notes || '',
    hotelConfirmationUrl: trip.hotelConfirmationUrl || '',
  })
  const [hasLaundry, setHasLaundry] = useState(savedLaundry.hasLaundry)
  const [laundryDate, setLaundryDate] = useState(savedLaundry.laundryDate)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const countryInputRef = useRef<HTMLInputElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node) &&
        !countryInputRef.current?.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (c: string) => {
    setFormData(prev => ({ ...prev, country: c }))
    setCountrySearch('')
    setShowCountryDropdown(false)
  }

  const handleLaundryToggle = (val: boolean) => {
    setHasLaundry(val)
    if (!val) setLaundryDate('')
    saveLaundrySettings(trip.id, { hasLaundry: val, laundryDate: val ? laundryDate : '' })
  }

  const handleLaundryDateChange = (val: string) => {
    setLaundryDate(val)
    saveLaundrySettings(trip.id, { hasLaundry, laundryDate: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.city.trim()) {
      setError('City is required')
      return
    }
    const fullDestination = formData.country
      ? `${formData.city.trim()}, ${formData.country.trim()}`
      : formData.city.trim()

    startTransition(async () => {
      const result = await updateTrip(trip.id, {
        name: formData.name.trim() || null,
        destination: fullDestination,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        tripType: formData.tripType,
        notes: formData.notes.trim() || null,
        hotelConfirmationUrl: formData.hotelConfirmationUrl.trim() || null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  const effectiveStart = formData.startDate || startDateStr
  const effectiveEnd = formData.endDate || endDateStr

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Edit Trip</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Trip Name (optional)</label>
            <input
              type="text" id="name" value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Summer Vacation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City/Location *</label>
              <input
                type="text" id="city" value={formData.city} required
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., San Francisco"
              />
            </div>
            <div className="relative">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <div className="relative">
                <input
                  ref={countryInputRef} type="text" id="country" required
                  placeholder="Type to search..."
                  value={showCountryDropdown ? countrySearch : formData.country}
                  onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true) }}
                  onFocus={() => setShowCountryDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div ref={countryDropdownRef} className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button key={c} type="button" onClick={() => handleCountrySelect(c)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors first:rounded-t-lg last:rounded-b-lg">
                      <span className={formData.country === c ? 'font-semibold text-blue-600' : 'text-gray-700'}>{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" id="startDate" value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" id="endDate" value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tripType" className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
            <select id="tripType" value={formData.tripType}
              onChange={e => setFormData(prev => ({ ...prev, tripType: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="beach">Beach</option>
              <option value="hiking">Hiking</option>
              <option value="city">City</option>
              <option value="skiing">Skiing</option>
              <option value="business">Business</option>
              <option value="leisure">Leisure</option>
            </select>
          </div>

          {/* Hotel Confirmation */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏨</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Hotel Confirmation</p>
                <p className="text-xs text-gray-500">Paste your online confirmation link — no need to print</p>
              </div>
            </div>
            <input
              type="url"
              id="hotelConfirmationUrl"
              value={formData.hotelConfirmationUrl}
              onChange={e => setFormData(prev => ({ ...prev, hotelConfirmationUrl: e.target.value }))}
              placeholder="https://booking.com/confirmation/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {formData.hotelConfirmationUrl && (
              <a
                href={formData.hotelConfirmationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
              >
                Open confirmation ↗
              </a>
            )}
          </div>

          {/* Laundry Access */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧷</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Laundry Access</p>
                  <p className="text-xs text-gray-500">Reduces outfit count for days after laundry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLaundryToggle(!hasLaundry)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  hasLaundry ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={hasLaundry}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasLaundry ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {hasLaundry && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Laundry date (mid-trip)</label>
                <input
                  type="date"
                  min={effectiveStart}
                  max={effectiveEnd}
                  value={laundryDate}
                  onChange={e => handleLaundryDateChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                />
                {laundryDate && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Outfit counts after {new Date(laundryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} are halved
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea id="notes" value={formData.notes} rows={3}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any additional details..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
