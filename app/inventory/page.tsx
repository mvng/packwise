import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserInventory } from '@/actions/inventory.actions'
import InventoryClient from '@/components/inventory/InventoryClient'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const cookieStore = await cookies()
    const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
    if (!isGuestMode) redirect('/login')
  }

  const { categories, error } = await getUserInventory()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 text-lg transition-colors"
            >
              ←
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">My Inventory</h1>
              <p className="text-xs text-gray-500">Items you own, reusable across any trip</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/luggage"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              🧳 Luggage
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        ) : (
          <InventoryClient initialCategories={categories ?? []} />
        )}
      </main>
    </div>
  )
}
