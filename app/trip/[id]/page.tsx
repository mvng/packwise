import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSharedTripById } from '@/actions/trip.actions'
import PackingListSection from '@/components/PackingListSection'
import ForkTripButton from '@/components/ForkTripButton'
import { formatDate } from '@/lib/utils'

interface TripPageProps {
  params: Promise<{ id: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use getSharedTripById for public access
  const { trip, error } = await getSharedTripById(id)
  if (error || !trip) {
    notFound()
  }

  // Determine if this is the owner or a shared view
  let isOwner = false
  if (user) {
    // Get the Prisma user ID from Supabase user
    const { data: users } = await supabase
      .from('User')
      .select('id')
      .eq('supabaseId', user.id)
      .limit(1)
    
    if (users && users.length > 0) {
      isOwner = users[0].id === trip.userId
    }
  }

  const isSharedView = !isOwner

  // For shared views, reset all items to unchecked
  const displayTrip = isSharedView ? {
    ...trip,
    packingLists: trip.packingLists.map(list => ({
      ...list,
      categories: list.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          isPacked: false
        }))
      }))
    }))
  } : trip

  const allItems = displayTrip.packingLists.flatMap(
    (list) => list.categories.flatMap((cat) => cat.items)
  )
  const totalItems = allItems.length
  const packedItems = allItems.filter((item) => item.isPacked).length
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

  const getTripEmoji = (tripType: string) => {
    const icons: Record<string, string> = {
      beach: '🏖️',
      hiking: '🥾',
      city: '🏙️',
      skiing: '⛷️',
      ski: '⛷️',
      business: '💼',
      leisure: '🌴',
    }
    return icons[tripType] || '✈️'
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return null
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isOwner && (
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-lg">
                ←
              </Link>
            )}
            <div>
              <h1 className="font-semibold text-gray-900">{trip.name || trip.destination}</h1>
              {trip.destination && (
                <p className="text-xs text-gray-500">📍 {trip.destination}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{getUserDisplayName()}</span>
                <Link 
                  href="/api/auth/signout"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign out
                </Link>
              </div>
            ) : (
              <Link 
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            )}
            {!isSharedView && totalItems > 0 && (
              <div className="text-sm text-gray-500">
                {packedItems}/{totalItems} packed
              </div>
            )}
          </div>
        </div>
        {/* Progress bar - only show for owners */}
        {!isSharedView && totalItems > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Shared view banner with fork button - ONLY show for non-owners */}
        {isSharedView && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl">👀</span>
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg mb-1">Viewing shared packing list</h3>
                  <p className="text-blue-700 text-sm">
                    This is a read-only view. You can save a copy of this packing list to your account and customize it for your own trip.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full lg:w-auto">
                <ForkTripButton 
                  tripId={id}
                  tripName={trip.name || trip.destination}
                  isAuthenticated={!!user}
                  variant="primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Trip info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {getTripEmoji(trip.tripType)}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{trip.name || trip.destination}</h2>
                {trip.startDate && (
                  <p className="text-sm text-gray-500">
                    {formatDate(trip.startDate)}
                    {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                  </p>
                )}
                {totalItems > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {totalItems} item{totalItems !== 1 ? 's' : ''} in this list
                  </p>
                )}
              </div>
            </div>
            {!isSharedView && progress === 100 && (
              <div className="text-right">
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-xs text-green-600 font-medium">All packed!</p>
              </div>
            )}
          </div>
          {!isSharedView && totalItems > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Packing progress</span>
                <span className="font-medium text-gray-700">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Packing lists */}
        <PackingListSection trip={displayTrip} readOnly={isSharedView} />
      </main>
    </div>
  )
}
