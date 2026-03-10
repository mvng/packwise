'use client'

import { useEffect, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSharedTripById } from '@/actions/trip.actions'
import { getTripWeather } from '@/actions/weather.actions'
import PackingListSection from '@/components/PackingListSection'
import ForkTripButton from '@/components/ForkTripButton'
import TripWeather from '@/components/TripWeather'
import EditTripModal from '@/components/EditTripModal'
import OutfitPlannerPanel from '@/components/OutfitPlannerPanel'
import { formatDate } from '@/lib/utils'

interface TripPageProps {
  params: Promise<{ id: string }>
}

function getTimezoneAbbreviation(timezone: string, date: Date): string {
  try {
    const dateStr = date.toLocaleDateString('en-US', {
      day: '2-digit',
      timeZoneName: 'short',
      timeZone: timezone
    })
    return dateStr.split(', ')[1] || ''
  } catch {
    return ''
  }
}

function getTimezoneOffsetDifference(destinationTimezone: string): string {
  try {
    const now = new Date()
    const localDateStr = now.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    const destDateStr = now.toLocaleString('en-US', { timeZone: destinationTimezone })
    const localDate = new Date(localDateStr)
    const destDate = new Date(destDateStr)
    const diffHours = Math.round((destDate.getTime() - localDate.getTime()) / (1000 * 60 * 60))
    if (diffHours === 0) return 'Same timezone as you'
    if (diffHours > 0) return `${diffHours} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ahead of you`
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} behind you`
  } catch (error) {
    console.error('Error calculating timezone difference:', error)
    return ''
  }
}

export default function TripPageClient({ params }: TripPageProps) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [editingTrip, setEditingTrip] = useState<any>(null)
  const [tripTimezone, setTripTimezone] = useState<string | null>(null)
  const [avgTempF, setAvgTempF] = useState<number | undefined>(undefined)

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      setId(resolvedParams.id)

      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      const { trip: fetchedTrip, error } = await getSharedTripById(resolvedParams.id)
      if (error || !fetchedTrip) {
        setIsNotFound(true)
        setLoading(false)
        return
      }

      setTrip(fetchedTrip)

      if (fetchedTrip.destination && fetchedTrip.startDate && fetchedTrip.endDate) {
        const { weather } = await getTripWeather(
          fetchedTrip.destination,
          fetchedTrip.startDate,
          fetchedTrip.endDate
        )
        if (weather?.timezone) setTripTimezone(weather.timezone)
        // temperature.avg is already in °F (API is called with temperature_unit=fahrenheit)
        if (weather?.temperature?.avg != null) {
          setAvgTempF(weather.temperature.avg)
        }
      }

      if (authUser) {
        const response = await fetch('/api/check-trip-ownership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId: resolvedParams.id, supabaseUserId: authUser.id })
        })
        const { isOwner: ownerStatus } = await response.json()
        setIsOwner(ownerStatus)
      }

      setLoading(false)
    }

    init()
  }, [params])

  const handleEditSuccess = async () => {
    setEditingTrip(null)
    const { trip: fetchedTrip } = await getSharedTripById(id)
    if (fetchedTrip) {
      setTrip(fetchedTrip)
      if (fetchedTrip.destination && fetchedTrip.startDate && fetchedTrip.endDate) {
        const { weather } = await getTripWeather(
          fetchedTrip.destination,
          fetchedTrip.startDate,
          fetchedTrip.endDate
        )
        if (weather?.timezone) setTripTimezone(weather.timezone)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isNotFound || !trip) return notFound()

  const isSharedView = !isOwner

  const displayTrip = isSharedView ? {
    ...trip,
    packingLists: trip.packingLists.map((list: any) => ({
      ...list,
      categories: list.categories.map((cat: any) => ({
        ...cat,
        items: cat.items.map((item: any) => ({ ...item, isPacked: false }))
      }))
    }))
  } : trip

  const allItems = displayTrip.packingLists.flatMap(
    (list: any) => list.categories.flatMap((cat: any) => cat.items)
  )
  const totalItems = allItems.length
  const packedItems = allItems.filter((item: any) => item.isPacked).length
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

  const getTripEmoji = (tripType: string) => {
    const icons: Record<string, string> = {
      beach: '🏖️', hiking: '🥾', city: '🏙️',
      skiing: '⛷️', ski: '⛷️', business: '💼', leisure: '🌴',
    }
    return icons[tripType] || '✈️'
  }

  const getUserDisplayName = () => {
    if (!user) return null
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email
  }

  const getTripOwnerName = () => {
    if (!trip.user) return 'Someone'
    return trip.user.name || trip.user.email || 'Someone'
  }

  const timezoneAbbr = tripTimezone && trip.startDate ? getTimezoneAbbreviation(tripTimezone, new Date(trip.startDate)) : ''
  const timezoneDifference = tripTimezone ? getTimezoneOffsetDifference(tripTimezone) : ''
  const timezoneTooltip = timezoneAbbr && timezoneDifference ? `${timezoneAbbr} • ${timezoneDifference}` : timezoneDifference

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
            )}
            {user ? (
              <Link href="/dashboard" className="hover:opacity-70 transition-opacity">
                <h1 className="font-semibold text-gray-900">{trip.name || trip.destination}</h1>
                {trip.destination && <p className="text-xs text-gray-500">📍 {trip.destination}</p>}
              </Link>
            ) : (
              <div>
                <h1 className="font-semibold text-gray-900">{trip.name || trip.destination}</h1>
                {trip.destination && <p className="text-xs text-gray-500">📍 {trip.destination}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{getUserDisplayName()}</span>
                <Link href="/api/auth/signout" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign out</Link>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
            )}
            {!isSharedView && totalItems > 0 && (
              <div className="text-sm text-gray-500">{packedItems}/{totalItems} packed</div>
            )}
          </div>
        </div>
        {!isSharedView && totalItems > 0 && (
          <div className="h-1 bg-gray-100">
            <div className="h-1 bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isSharedView && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl">👀</span>
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg mb-1">Viewing shared packing list</h3>
                  <p className="text-blue-700 text-sm mb-2">Created by <span className="font-medium">{getTripOwnerName()}</span></p>
                  <p className="text-blue-700 text-sm">This is a read-only view. You can save a copy of this packing list to your account and customize it for your own trip.</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full lg:w-auto">
                <ForkTripButton tripId={id} tripName={trip.name || trip.destination} isAuthenticated={!!user} variant="primary" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getTripEmoji(trip.tripType)}</div>
              <div>
                <h2 className="font-semibold text-gray-900">{trip.name || trip.destination}</h2>
                {trip.startDate && (
                  <div className="relative inline-block group">
                    <p className="text-sm text-gray-500 cursor-help">
                      {formatDate(trip.startDate)}
                      {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                    </p>
                    {timezoneTooltip && (
                      <div className="absolute left-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{timezoneTooltip}</div>
                      </div>
                    )}
                  </div>
                )}
                {totalItems > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} in this list</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isSharedView && progress === 100 && (
                <div className="text-right mr-2">
                  <div className="text-3xl mb-1">🎉</div>
                  <p className="text-xs text-green-600 font-medium">All packed!</p>
                </div>
              )}
              {!isSharedView && (
                <button
                  onClick={() => setEditingTrip(trip)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  aria-label="Edit trip"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="3" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="17" r="1.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {trip.destination && trip.startDate && trip.endDate && (
            <div className="mb-4">
              <TripWeather destination={trip.destination} startDate={trip.startDate} endDate={trip.endDate} variant="detail" />
            </div>
          )}

          {!isSharedView && totalItems > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Packing progress</span>
                <span className="font-medium text-gray-700">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {!isSharedView && trip.startDate && trip.endDate && (
          <div className="mb-6">
            <OutfitPlannerPanel
              tripId={id}
              startDate={trip.startDate}
              endDate={trip.endDate}
              tripLuggages={trip.tripLuggages}
              avgTempF={avgTempF}
              tripType={trip.tripType}
            />
          </div>
        )}

        <PackingListSection
          trip={displayTrip}
          readOnly={isSharedView}
          sharedTripLuggages={isSharedView ? trip.tripLuggages : undefined}
        />
      </main>

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
