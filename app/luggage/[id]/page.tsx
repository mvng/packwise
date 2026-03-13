import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLuggageHistory } from '@/actions/luggage.actions'
import { LuggageHistoryStats } from '@/components/luggage/LuggageHistoryStats'
import { LuggageTripTimeline } from '@/components/luggage/LuggageTripTimeline'
import type { LuggageWithHistory } from '@/types/luggage'

export default async function LuggageHistoryPage({ params }: { params: { id: string } }) {
  const { id } = params
  const result = await getLuggageHistory(id)

  if (result.error || !result.luggage) {
    redirect('/luggage')
  }

  const luggage = result.luggage as unknown as LuggageWithHistory

  // Map luggage type values to emoji icons
  const typeIconMap: Record<string, string> = {
    'backpack': '🎒',
    'carry-on': '🧳',
    'checked': '🧳',
    'personal-item': '👜',
    'trunk': '📦',
  }
  const typeIcon = typeIconMap[luggage.type] || '🗃️'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/luggage" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2">
        <span>←</span> Back to Luggage
      </Link>

      <div className="flex items-center gap-4 mb-2">
        <div className="text-4xl">
          {luggage.icon || typeIcon}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{luggage.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted border border-border capitalize">
              {luggage.type.replace('-', ' ')}
            </span>
            {luggage.capacityLiters && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                {luggage.capacityLiters}L
              </span>
            )}
            {luggage.capacity && !luggage.capacityLiters && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                {luggage.capacity}L
              </span>
            )}
          </div>
        </div>
      </div>

      <LuggageHistoryStats
        tripLuggages={luggage.tripLuggages}
        homeCity={luggage.user.homeCity}
      />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-6">Trip History</h2>
        <LuggageTripTimeline tripLuggages={luggage.tripLuggages} />
      </div>
    </div>
  )
}
