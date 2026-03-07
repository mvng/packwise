'use client'

import { useState } from 'react'
import PackingListSection from '@/components/PackingListSection'
import TripBagsSection, { TripBagEntry, OwnedBag, TripBagItem } from '@/components/bags/TripBagsSection'

interface PackingItemRaw {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
}

interface CategoryRaw {
  id: string
  name: string
  order: number
  items: PackingItemRaw[]
}

interface PackingListRaw {
  id: string
  name: string
  categories: CategoryRaw[]
}

interface TripRaw {
  id: string
  packingLists: PackingListRaw[]
}

interface Props {
  trip: TripRaw
  tripBags: TripBagEntry[]
  ownedBags: OwnedBag[]
  allItems: TripBagItem[]
}

export default function TripPageTabs({ trip, tripBags, ownedBags, allItems }: Props) {
  const [tab, setTab] = useState<'packing' | 'bags'>('packing')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('packing')}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'packing'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Packing List
        </button>
        <button
          onClick={() => setTab('bags')}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === 'bags'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧳 Bags
          {tripBags.length > 0 && (
            <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {tripBags.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'packing' && <PackingListSection trip={trip} />}
      {tab === 'bags' && (
        <TripBagsSection
          tripId={trip.id}
          tripBags={tripBags}
          ownedBags={ownedBags}
          allItems={allItems}
        />
      )}
    </div>
  )
}
