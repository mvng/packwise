import { getLuggageHistory } from '@/actions/luggage.actions'
import LuggageHistoryStats from '@/components/luggage/LuggageHistoryStats'
import LuggageTripTimeline from '@/components/luggage/LuggageTripTimeline'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { LuggageType } from '@/types/luggage'

const luggageIcons: Record<LuggageType, string> = {
  backpack: '🎒',
  'carry-on': '🧳',
  checked: '💼',
  trunk: '📦',
  other: '👜',
}

export default async function LuggageHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { luggage, error } = await getLuggageHistory(id)

  if (error || !luggage) {
    redirect('/luggage')
  }

  const typedLuggage = luggage as any

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <Link
          href="/luggage"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Luggage
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="text-4xl">{luggageIcons[typedLuggage.type as LuggageType] || '🧳'}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typedLuggage.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md capitalize">
                {typedLuggage.type}
              </span>
              {typedLuggage.capacity && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {typedLuggage.capacity}L
                </span>
              )}
            </div>
          </div>
        </div>

        <LuggageHistoryStats
          trips={typedLuggage.tripLuggages || []}
          homeCity={typedLuggage.user?.homeCity || null}
        />

        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trip History</h2>
          <LuggageTripTimeline tripLuggages={typedLuggage.tripLuggages || []} />
        </div>
      </div>
    </div>
  )
}
