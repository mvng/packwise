'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSharedTripById } from '@/actions/trip.actions'
import { getTripWeather } from '@/actions/weather.actions'
import PackingListSection from '@/components/PackingListSection'
import ForkTripButton from '@/components/ForkTripButton'
import TripCountdown from '@/components/TripCountdown'
import EditTripModal from '@/components/EditTripModal'
import PackingRating from '@/components/PackingRating'
import TripMembersSection from '@/components/TripMembersSection'
import { formatDate } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { Calendar, Check } from 'lucide-react'

const PlanningBoardView = dynamic(() => import('@/components/PlanningBoardView'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">Loading planning board...</div>
})

interface TripPageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTrip: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  isOwner: boolean
  initialTripTimezone: string | null
  weatherComponent?: React.ReactNode
}

function getTimezoneAbbreviation(timezone: string, date: Date): string {
  try {
    const dateStr = date.toLocaleDateString('en-US', { day: '2-digit', timeZoneName: 'short', timeZone: timezone })
    return dateStr.split(', ')[1] || ''
  } catch { return '' }
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
  } catch { return '' }
}

export default function TripPageClient({ initialTrip, user, isOwner, initialTripTimezone, weatherComponent }: TripPageClientProps) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(initialTrip)
  const id = initialTrip.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingTrip, setEditingTrip] = useState<any>(null)
  const [tripTimezone, setTripTimezone] = useState<string | null>(initialTripTimezone)

  // Sync prop updates (from router.refresh) to local state
  useEffect(() => {
    setTrip(initialTrip)
    setTripTimezone(initialTripTimezone)
  }, [initialTrip, initialTripTimezone])

  const [viewMode, setViewMode] = useState<'plan' | 'pack'>('pack')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleEditSuccess = async () => {
    setEditingTrip(null)

    const { trip: fetchedTrip } = await getSharedTripById(id)

    if (fetchedTrip) {
      setTrip(fetchedTrip)

      if (fetchedTrip.destination && fetchedTrip.startDate && fetchedTrip.endDate) {
        const { weather } = await getTripWeather(fetchedTrip.destination, fetchedTrip.startDate, fetchedTrip.endDate)
        if (weather?.timezone) {
          setTripTimezone(weather.timezone)
        }
      }
    }

    router.refresh()
  }

  const isSharedView = !isOwner
  const displayTrip = isSharedView ? {
    ...trip,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packingLists: trip.packingLists.map((list: any) => ({
      ...list,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories: list.categories.map((cat: any) => ({
        ...cat,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: cat.items.map((item: any) => ({ ...item, isPacked: false }))
      }))
    }))
  } : trip

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems = displayTrip.packingLists.flatMap((list: any) => list.categories.flatMap((cat: any) => cat.items))
  const totalItems = allItems.length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packedItems = allItems.filter((item: any) => item.isPacked).length
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

  const getTripEmoji = (tripType: string) => {
    const icons: Record<string, string> = { beach: '🏖️', hiking: '🦵', city: '🏙️', skiing: '⛷️', ski: '⛷️', business: '💼', leisure: '🌴' }
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user && <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>}
            {!isSharedView ? (
              <button onClick={() => setEditingTrip(trip)} className="text-left hover:opacity-70 transition-opacity">
                <h1 className="font-semibold text-gray-900">{trip.name || trip.destination}</h1>
                {trip.destination && <p className="text-xs text-gray-500">📍 {trip.destination}</p>}
              </button>
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

      <main className={`max-w-[1600px] mx-auto px-6 py-8 transition-all`}>
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
                <ForkTripButton tripId={id} isAuthenticated={!!user} variant="primary" />
              </div>
            </div>
          </div>
        )}

        {/* Trip meta card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <TripMembersSection tripId={trip.id} members={trip.members || []} isOwner={isOwner} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getTripEmoji(trip.tripType)}</div>
              <div>
                {!isSharedView ? (
                  <button onClick={() => setEditingTrip(trip)} className="text-left hover:opacity-70 transition-opacity">
                    <h2 className="font-semibold text-gray-900">{trip.name || trip.destination}</h2>
                  </button>
                ) : (
                  <h2 className="font-semibold text-gray-900">{trip.name || trip.destination}</h2>
                )}
                {trip.startDate && (
                  <div className="relative inline-block group">
                    <p className="text-sm text-gray-500 cursor-help mt-1">
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
              </div>
            </div>
            {!isSharedView && (
              <button
                onClick={() => setEditingTrip(trip)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="3" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="10" cy="17" r="1.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Countdown banner */}
          {trip.startDate && (
            <div className="mb-4">
              <TripCountdown startDate={trip.startDate} endDate={trip.endDate} variant="detail" />
            </div>
          )}

          {trip.destination && trip.startDate && trip.endDate && weatherComponent && (
            weatherComponent
          )}
        </div>

        {/* View toggle */}
        {!isSharedView && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit mb-6">
            <button
              disabled={isSyncing || isPending}
              onClick={() => setViewMode('plan')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 flex items-center gap-1.5 ${
                viewMode === 'plan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" /> Plan
            </button>
            <button
              disabled={isSyncing || isPending}
              onClick={async () => {
                if (viewMode === 'plan') {
                  setIsSyncing(true)
                  await fetch('/api/day-plans/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tripId: trip.id }),
                  })
                  setIsSyncing(false)
                  setViewMode('pack')
                  startTransition(() => {
                    router.refresh()
                  })
                } else {
                  setViewMode('pack')
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 flex items-center gap-1.5 ${
                viewMode === 'pack' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {(isSyncing || isPending) ? 'Syncing…' : <><Check className="w-4 h-4" /> Pack</>}
            </button>
          </div>
        )}

        {/* Content */}
        {!isSharedView && viewMode === 'plan' ? (
          <PlanningBoardView trip={displayTrip} />
        ) : (
          <PackingListSection
            trip={displayTrip}
            readOnly={isSharedView}
            sharedTripLuggages={isSharedView ? trip.tripLuggages : undefined}
          />
        )}

        {/* Packing Rating Footnote */}
        {displayTrip.packingLists.length > 0 && (
          <PackingRating trip={displayTrip} />
        )}
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
