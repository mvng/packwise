'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserSettings, updateUserSettings } from '@/actions/user.actions'

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
  'Japan', 'South Korea', 'Mexico', 'Brazil', 'India', 'China', 'Italy', 'Spain',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'New Zealand',
  'Singapore', 'UAE', 'South Africa', 'Argentina', 'Chile', 'Colombia', 'Portugal',
]

export default function SettingsPage() {
  const router = useRouter()
  const [homeCity, setHomeCity] = useState('')
  const [homeCountry, setHomeCountry] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const result = await getUserSettings()
      if (result.settings) {
        setHomeCity(result.settings.homeCity ?? '')
        setHomeCountry(result.settings.homeCountry ?? '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    const result = await updateUserSettings({
      homeCity: homeCity.trim() || null,
      homeCountry: homeCountry.trim() || null,
    })
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error ?? 'Failed to save')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-xl text-gray-900">Packwise</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">
          Personalize Packwise so your packing lists are smarter.
        </p>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Home Location */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">🏠 Home Location</h2>
            <p className="text-sm text-gray-500 mb-5">
              When your destination is close to home, Packwise will assume you&apos;re driving — removing
              passport and boarding pass suggestions from your packing list.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="homeCity" className="block text-sm font-medium text-gray-700 mb-1">
                  Home city
                </label>
                <input
                  id="homeCity"
                  type="text"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="e.g. San Diego"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Used to detect short domestic drives (&lt;500 km).</p>
              </div>

              <div>
                <label htmlFor="homeCountry" className="block text-sm font-medium text-gray-700 mb-1">
                  Home country
                </label>
                <select
                  id="homeCountry"
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">International trips always include passport.</p>
              </div>
            </div>

            {/* Preview callout */}
            {homeCity && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                ✈️ Trips to destinations within ~500 km of <strong>{homeCity}</strong> will be treated as
                road trips — no passport or boarding pass will be suggested.
              </div>
            )}
          </section>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </form>
      </main>
    </div>
  )
}
