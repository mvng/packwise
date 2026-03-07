import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserBags } from '@/actions/bags.actions'
import BagsPageClient from '@/components/bags/BagsPageClient'

export const metadata = { title: 'My Bags – Packwise' }

export default async function BagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await getUserBags()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <a href="/inventory" className="text-gray-400 hover:text-gray-600 text-lg">←</a>
            <h1 className="text-2xl font-bold text-gray-900">My Bags</h1>
          </div>
          <p className="text-gray-500 text-sm ml-8">
            Manage the bags and luggage you own. Add them to trips to assign items.
          </p>
        </div>
        {result.error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {result.error}
          </div>
        ) : (
          <BagsPageClient initialBags={result.bags ?? []} />
        )}
      </div>
    </main>
  )
}
