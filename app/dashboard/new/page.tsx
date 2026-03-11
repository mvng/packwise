'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTrip } from '@/actions/trip.actions'

const TRIP_TYPES = [
  { value: 'leisure', label: 'Leisure', icon: '🌴' },
  { value: 'beach', label: 'Beach', icon: '🏖️' },
  { value: 'hiking', label: 'Hiking', icon: '🏕️' },
  { value: 'city', label: 'City Break', icon: '🏙️' },
  { value: 'skiing', label: 'Ski', icon: '⛷️' },
  { value: 'business', label: 'Business', icon: '💼' },
]

const COUNTRIES = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Japan',
  'China',
  'Australia',
  'New Zealand',
  'Brazil',
  'Argentina',
  'India',
  'South Korea',
  'Thailand',
  'Vietnam',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Philippines',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Portugal',
  'Greece',
  'Turkey',
  'Egypt',
  'South Africa',
  'Kenya',
  'Morocco',
  'United Arab Emirates',
  'Israel',
  'Russia',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Norway',
  'Sweden',
  'Denmark',
  'Finland',
  'Iceland',
  'Ireland',
  'Croatia',
  'Chile',
  'Peru',
  'Colombia',
  'Costa Rica',
].sort()

export default function NewTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    country: 'United States',
    tripType: 'leisure',
    startDate: '',
    endDate: '',
    generateSuggestions: true,
  })
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const countryInputRef = useRef<HTMLInputElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Close dropdown when clicking outside
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

  const handleCountrySelect = (country: string) => {
    setFormData({ ...formData, country })
    setCountrySearch('')
    setShowCountryDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Combine destination with country for better geocoding
    const fullDestination = formData.country
      ? `${formData.destination}, ${formData.country}`
      : formData.destination

    const result = await createTrip({
      name: formData.name,
      destination: fullDestination || '',
      tripType: formData.tripType,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      generateSuggestions: formData.generateSuggestions,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.tripId) {
      router.push(`/trip/${result.tripId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Plan a New Trip</h1>
          <p className="text-gray-500 mt-2">Tell us about your trip and we&apos;ll create a smart packing list for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trip Name</label>
            <input
              type="text"
              placeholder="e.g. Summer in Paris"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City/Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. San Francisco"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <div className="relative">
                <input
                  ref={countryInputRef}
                  type="text"
                  required
                  placeholder="Type to search..."
                  value={showCountryDropdown ? countrySearch : formData.country}
                  onChange={(e) => {
                    setCountrySearch(e.target.value)
                    setShowCountryDropdown(true)
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div
                  ref={countryDropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className={formData.country === country ? 'font-semibold text-blue-600' : 'text-gray-700'}>
                        {country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Trip Type</label>
            <div className="grid grid-cols-3 gap-3">
              {TRIP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tripType: t.value })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    formData.tripType === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{t.icon}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="suggestions"
              checked={formData.generateSuggestions}
              onChange={(e) => setFormData({ ...formData, generateSuggestions: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <label htmlFor="suggestions" className="text-sm text-gray-700">
              Auto-generate smart packing suggestions
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.destination || !formData.country}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Trip...' : 'Create Trip & Generate List'}
          </button>
        </form>
      </div>
    </div>
  )
}
