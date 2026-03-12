import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardTrips } from '@/actions/trip.actions'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { trips = [], error } = await getDashboardTrips()

  if (error) {
    console.error('Failed to load trips:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
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
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1.5"
            >
              ⚙️ <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content populated by client component for interactions */}
      <DashboardClient initialTrips={trips as any} />
    </div>
  )
}
