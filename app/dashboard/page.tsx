import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserTrips } from '@/actions/trip.actions'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { trips } = await getUserTrips()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧳</span>
            <span className="font-bold text-xl text-gray-900">Packwise</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-500 mt-1">
              {trips && trips.length > 0
                ? `${trips.length} trip${trips.length === 1 ? '' : 's'}`
                : 'No trips yet'}
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>New trip</span>
          </Link>
        </div>

        {/* Trips grid */}
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all hover:border-blue-100 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">
                    {trip.type === 'beach' ? '🏖️' :
                     trip.type === 'hiking' ? '🥾' :
                     trip.type === 'city' ? '🏙️' :
                     trip.type === 'ski' ? '⛷️' :
                     trip.type === 'business' ? '💼' : '✈️'}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    trip.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : trip.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {trip.status === 'in_progress' ? 'Packing' :
                     trip.status === 'completed' ? 'Packed' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {trip.name}
                </h3>
                {trip.destination && (
                  <p className="text-sm text-gray-500 mt-1">📍 {trip.destination}</p>
                )}
                {trip.startDate && (
                  <p className="text-sm text-gray-400 mt-2">
                    {formatDate(trip.startDate)}
                    {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{trip._count?.packingLists ?? 0} list(s)</span>
                    <span className="text-blue-500 font-medium">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h2>
            <p className="text-gray-500 mb-6">Create your first trip to get started with smart packing.</p>
            <Link
              href="/dashboard/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Create your first trip
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
