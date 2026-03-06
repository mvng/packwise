'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserTrips } from '@/actions/trip.actions'
import { formatDate } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

type Trip = {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  tripType: string
  createdAt: string
}

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
  return icons[tripType] || '🧳'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      try {
        const userTrips = await getUserTrips()
        setTrips(userTrips || [])
      } catch (e) {
        console.error('Failed to load trips:', e)
      }
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

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
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-500 mt-1">Manage your packing lists</p>
          </div>
          <Link
            href="/trip/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧳</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h2>
            <p className="text-gray-500 mb-6">Create your first trip to get started with smart packing lists.</p>
            <Link
              href="/trip/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{getTripEmoji(trip.tripType)}</span>
                  <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded-full">{trip.tripType}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{trip.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{trip.destination}</p>
                <div className="text-xs text-gray-400">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
