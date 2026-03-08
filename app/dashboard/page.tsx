'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserTrips, deleteTrip } from '@/actions/trip.actions'
import { formatDate, formatDateWithTimezone } from '@/lib/utils'
import { getTripWeather } from '@/actions/weather.actions'
import TripWeather from '@/components/TripWeather'
import EditTripModal from '@/components/EditTripModal'
import type { User } from '@supabase/supabase-js'

type Trip = {
  id: string
  name: string | null
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  tripType: string | null
  notes: string | null
  createdAt: Date | string
  packingLists?: Array<{
    categories: Array<{
      items: Array<{ isPacked: boolean }>
    }>
  }>
}

const getTripEmoji = (tripType: string | null) => {
  if (!tripType) return '🧳'
  const icons: Record<string, string> = {
    beach: '🏖️',
    hiking: '🥾',
    city: '🏙️',
    skiing: '⛷️',
    ski: '⛷️',
    business: '💼',
    leisure: '🎡',
  }
  return icons[tripType] || '🧳'
}

const getTripProgress = (trip: Trip) => {
  const allItems = trip.packingLists?.flatMap((l) => l.categories.flatMap((c) => c.items)) ?? []
  const total = allItems.length
  const packed = allItems.filter((i) => i.isPacked).length
  return { total, packed, percent: total > 0 ? Math.round((packed / total) * 100) : 0 }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [tripTimezones, setTripTimezones] = useState<Record<string, string>>({})

  const loadTrips = useCallback(async () => {
    try {
      const result = await getUserTrips()
      if (result.trips) {
        const tripList = result.trips as Trip[]
        setTrips(tripList)
        
        // Fetch timezones for all trips with destinations
        const timezones: Record<string, string> = {}
        await Promise.all(
          tripList.map(async (trip) => {
            if (trip.destination && trip.startDate && trip.endDate) {
              const { weather } = await getTripWeather(
                trip.destination,
                trip.startDate,
                trip.endDate
              )
              if (weather?.timezone) {
                timezones[trip.id] = weather.timezone
              }
            }
          })
        )
        setTripTimezones(timezones)
      }
    } catch (e) {
      console.error('Failed to load trips', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await loadTrips()
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, loadTrips])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) return
    setDeletingId(tripId)
    const result = await deleteTrip(tripId)
    if (result.success) {
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
    }
    setDeletingId(null)
  }

  const handleEditTrip = (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault()
    setEditingTrip(trip)
  }

  const handleEditSuccess = () => {
    setEditingTrip(null)
    loadTrips()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-xl text-gray-900">Packwise</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1.5"
            >
              🎒 <span className="hidden sm:inline">Inventory</span>
            </Link>
            <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-500 mt-1">Manage your packing lists</p>
          </div>
          <Link
            href="/dashboard/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧳</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first trip to get started with smart packing lists.
            </p>
            <Link
              href="/dashboard/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const { total, packed, percent } = getTripProgress(trip)
              const timezone = tripTimezones[trip.id]
              
              return (
                <div key={trip.id} className="relative group">
                  <Link
                    href={`/trip/${trip.id}`}
                    className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{getTripEmoji(trip.tripType)}</span>
                      <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded-full">
                        {trip.tripType || 'trip'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {trip.name || 'Untitled Trip'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{trip.destination || ''}</p>
                    <div className="text-xs text-gray-400 mb-3">
                      {trip.startDate && timezone ? (
                        formatDateWithTimezone(trip.startDate as string, timezone)
                      ) : trip.startDate ? (
                        formatDate(trip.startDate as string, { includeTimezone: true })
                      ) : ''}
                      {trip.endDate ? (
                        <>
                          {' – '}
                          <span className="inline-block">
                            {formatDate(trip.endDate as string)}
                          </span>
                        </>
                      ) : ''}
                    </div>
                    
                    {/* Weather widget */}
                    <TripWeather 
                      destination={trip.destination}
                      startDate={trip.startDate}
                      endDate={trip.endDate}
                    />
                    
                    {total > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{packed}/{total} packed</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              percent === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                  
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button
                      onClick={(e) => handleEditTrip(e, trip)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      aria-label="Edit trip"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      disabled={deletingId === trip.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      aria-label="Delete trip"
                    >
                      {deletingId === trip.id ? '…' : '🗑️'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer with weather disclaimer */}
      {trips.length > 0 && (
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-xs text-gray-400 text-center">
              Weather forecasts shown for trips within 14 days. Forecasts are estimates and may change.
            </p>
          </div>
        </footer>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
