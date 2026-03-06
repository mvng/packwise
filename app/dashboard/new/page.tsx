'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTrip } from '@/actions/trip.actions'

const TRIP_TYPES = [
  { value: 'leisure', label: 'Leisure', icon: '✈️' },
  { value: 'beach', label: 'Beach', icon: '🏖️' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'city', label: 'City Break', icon: '🏙️' },
  { value: 'ski', label: 'Ski', icon: '⛷️' },
  { value: 'business', label: 'Business', icon: '💼' },
]

export default function NewTripPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    type: 'leisure',
    startDate: '',
    endDate: '',
    generateSuggestions: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createTrip({
      name: formData.name,
      destination: formData.destination || undefined,
      type: formData.type,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      generateSuggestions: formData.generateSuggestions,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.trip) {
      router.push(`/trip/${result.trip.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-xl text-gray-900">New Trip</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Create a new trip</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Summer vacation in Barcelona"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Barcelona, Spain"
              />
            </div>

            {/* Trip type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TRIP_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* AI suggestions */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <input
                type="checkbox"
                id="generateSuggestions"
                checked={formData.generateSuggestions}
                onChange={(e) => setFormData({ ...formData, generateSuggestions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <label htmlFor="generateSuggestions" className="text-sm font-medium text-blue-900">
                  Generate smart packing suggestions
                </label>
                <p className="text-xs text-blue-600 mt-0.5">
                  We'll create a starter packing list based on your trip type and destination.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create trip'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
