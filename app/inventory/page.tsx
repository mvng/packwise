import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserInventory } from '@/actions/inventory.actions'
import InventoryPageClient from '@/components/inventory/InventoryPageClient'

export const metadata = { title: 'My Inventory – Packwise' }

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await getUserInventory()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your gear and add items directly to any trip packing list.
          </p>
        </div>
        {result.error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {result.error}
          </div>
        ) : (
          <InventoryPageClient initialCategories={result.categories ?? []} />
        )}
      </div>
    </main>
  )
}
