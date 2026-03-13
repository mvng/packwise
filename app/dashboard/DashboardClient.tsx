'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { deleteTrip, getDashboardTrips } from '@/actions/trip.actions'
import { formatDate } from '@/lib/utils'
import TripCountdown from '@/components/TripCountdown'
import EditTripModal from '@/components/EditTripModal'
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import DashboardTripWeather from '@/components/DashboardTripWeather'

type Trip = {
  id: string
  name: string | null
  destination: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  tripType: string | null
  hotelConfirmationUrl?: string | null
  notes: string | null
  createdAt: Date | string
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

export default function DashboardClient({
  initialTrips
}: {
  initialTrips: Trip[]
}) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  const reloadTrips = async () => {
    try {
      const result = await getDashboardTrips()
      if (result.trips) {
        setTrips(result.trips as Trip[])
      }
    } catch (e) {
      console.error('Failed to load trips', e)
    }
  }

  const upcomingTrips = useMemo(() => {
    // ⚡ Bolt Performance Optimization
    // Why: Prevents O(n log n) sorting and O(n) filtering of the trips array on every render.
    // Impact: Avoids unnecessary recalculations when unrelated state changes (e.g. editingTrip, deletingId).
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return trips.filter(t => {
      if (!t.endDate) return true
      const endDate = new Date(t.endDate)
      endDate.setHours(0, 0, 0, 0)
      return endDate >= now
    }).sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
  }, [trips])

  const pastTrips = useMemo(() => {
    // ⚡ Bolt Performance Optimization
    // Why: Prevents expensive date instantiation and array sorting on every render cycle.
    // Impact: Keeps the dashboard UI responsive even for users with extensive travel histories.
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return trips.filter(t => {
      if (!t.endDate) return false
      const endDate = new Date(t.endDate)
      endDate.setHours(0, 0, 0, 0)
      return endDate < now
    }).sort((a, b) => {
      if (!a.endDate) return 1
      if (!b.endDate) return -1
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })
  }, [trips])

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
    reloadTrips()
  }

  const renderTripCard = (trip: Trip) => (
    <div key={trip.id} className="relative group">
      <Link
        href={`/trip/${trip.id}`}
        prefetch={true}
        className="block bg-white rounded-xl shadow-sm border border-gray-300 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{getTripEmoji(trip.tripType)}</span>
          <div className="flex items-center gap-1.5">
            {trip.hotelConfirmationUrl && (
              <span className="text-xs" title="Hotel confirmation saved">🏨</span>
            )}
            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
              {trip.tripType || 'trip'}
            </span>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">
          {trip.name || 'Untitled Trip'}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{trip.destination || ''}</p>
        <div className="text-xs text-gray-500 mb-2">
          {trip.startDate ? formatDate(trip.startDate as string) : ''}
          {trip.endDate ? ` – ${formatDate(trip.endDate as string)}` : ''}
        </div>

        {/* Countdown badge */}
        <div className="mb-3">
          <TripCountdown startDate={trip.startDate} endDate={trip.endDate} variant="card" />
        </div>

        {/* Weather widget */}
        {trip.destination && trip.startDate && trip.endDate && (
          <DashboardTripWeather
            destination={trip.destination}
            startDate={trip.startDate}
            endDate={trip.endDate}
          />
        )}
      </Link>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button
          onClick={(e) => handleEditTrip(e, trip)}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center justify-center"
          aria-label="Edit trip"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => handleDeleteTrip(e, trip.id)}
          disabled={deletingId === trip.id}
          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
          aria-label="Delete trip"
        >
          {deletingId === trip.id ? <MoreHorizontal className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  const renderPastTripItem = (trip: Trip) => (
    <div key={trip.id} className="relative group">
      <Link
        href={`/trip/${trip.id}`}
        prefetch={true}
        className="block bg-white rounded-lg border border-gray-300 p-4 hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTripEmoji(trip.tripType)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {trip.name || 'Untitled Trip'}
            </h3>
            <p className="text-xs text-gray-500 truncate mb-1">{trip.destination || ''}</p>
            <div className="text-[11px] text-gray-500">
              {trip.startDate ? formatDate(trip.startDate as string) : ''}
              {trip.endDate ? ` – ${formatDate(trip.endDate as string)}` : ''}
            </div>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity bg-white/90 rounded-md backdrop-blur-sm shadow-sm">
        <button
          onClick={(e) => handleEditTrip(e, trip)}
          className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-all flex items-center justify-center"
          aria-label="Edit trip"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => handleDeleteTrip(e, trip.id)}
          disabled={deletingId === trip.id}
          className="p-1.5 text-gray-500 hover:text-red-500 rounded transition-all disabled:opacity-50 flex items-center justify-center"
          aria-label="Delete trip"
        >
          {deletingId === trip.id ? <MoreHorizontal className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-8 w-full">
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
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {upcomingTrips.length > 0 ? (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Trips</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingTrips.map(renderTripCard)}
                  </div>
                </section>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 mb-4">No upcoming trips planned.</p>
                  <Link
                    href="/dashboard/new"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Plan a new trip
                  </Link>
                </div>
              )}
            </div>

            {pastTrips.length > 0 && (
              <aside className="w-full lg:w-80 flex-shrink-0">
                <section className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Past Trips</h2>
                  <div className="space-y-3 opacity-90 hover:opacity-100 transition-opacity">
                    {pastTrips.map(renderPastTripItem)}
                  </div>
                </section>
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Footer with weather disclaimer */}
      {trips.length > 0 && (
        <footer className="border-t border-gray-300 bg-white mt-12">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <p className="text-xs text-gray-500 text-center">
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
    </>
  )
}
