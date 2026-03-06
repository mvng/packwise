import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTripById } from '@/actions/trip.actions'
import PackingListSection from '@/components/PackingListSection'
import { formatDate } from '@/lib/utils'

interface TripPageProps {
  params: Promise<{ id: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Allow access if the user is in guest mode
    const cookieStore = await cookies()
    const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
    if (!isGuestMode) {
      redirect('/login')
    }
  }

  const { trip, error } = await getTripById(id)
  if (error || !trip) {
    notFound()
  }

  const allItems = trip.packingLists.flatMap(
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-lg">
              ←
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{trip.name || trip.destination}</h1>
              {trip.destination && (
                <p className="text-xs text-gray-500">📍 {trip.destination}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalItems > 0 && (
              <div className="text-sm text-gray-500">
                {packedItems}/{totalItems} packed
              </div>
            )}
          </div>
        </div>
        {/* Progress bar */}
        {totalItems > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
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
              </div>
            </div>
            {progress === 100 && (
              <div className="text-right">
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-xs text-green-600 font-medium">All packed!</p>
              </div>
            )}
          </div>
          {totalItems > 0 && (
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
        <PackingListSection trip={trip} />
      </main>
    </div>
  )
}
