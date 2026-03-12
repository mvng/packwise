import React from 'react'
import { getTripDuration } from '@/lib/utils'

interface PackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
}

interface Category {
  id: string
  name: string
  items: PackingItem[]
}

interface PackingList {
  id: string
  name: string
  categories: Category[]
}

interface Trip {
  id: string
  startDate: string | Date | null
  endDate: string | Date | null
  packingLists: PackingList[]
}

interface PackingRatingProps {
  trip: Trip
}

export default function PackingRating({ trip }: PackingRatingProps) {
  if (!trip.startDate || !trip.endDate || !trip.packingLists || trip.packingLists.length === 0) {
    return null
  }

  const duration = getTripDuration(trip.startDate, trip.endDate)

  if (duration <= 0) return null

  let clothingCount = 0

  trip.packingLists.forEach(list => {
    list.categories.forEach(category => {
      // Look for clothing-related categories or items
      const categoryName = category.name.toLowerCase()
      if (categoryName.includes('clothing') || categoryName.includes('clothes') || categoryName.includes('apparel')) {
        category.items.forEach(item => {
          clothingCount += item.quantity || 1
        })
      }
    })
  })

  /**
   * Basic logic for packing rating:
   * - Underpacking: Less than 1 clothing item per trip day.
   * - Overpacking: More than 3 clothing items per trip day.
   * - Good: Between 1 and 3 clothing items per trip day.
   */
  let ratingText = "On track"
  let ratingColor = "bg-green-50 border-green-200 text-green-800"
  let icon = "✅"
  let subtext = `You have packed a solid amount of clothing (${clothingCount} items) for a ${duration}-day trip.`

  if (clothingCount === 0) {
    return null // Not enough data or no clothing category yet
  }

  if (clothingCount < duration) {
    ratingText = "Efficient packing"
    ratingColor = "bg-amber-50 border-amber-200 text-amber-800"
    icon = "🎒"
    subtext = `You're packing light with ${clothingCount} clothing items for a ${duration}-day trip.`
  } else if (clothingCount > duration * 3) {
    ratingText = "Well-prepared"
    ratingColor = "bg-blue-50 border-blue-200 text-blue-800"
    icon = "🧳"
    subtext = `You have plenty of options with ${clothingCount} clothing items for a ${duration}-day trip.`
  }

  return (
    <div className={`rounded-xl border p-3 mt-8 flex items-center gap-3 w-fit mx-auto ${ratingColor} shadow-sm`}>
      <div className="text-lg">{icon}</div>
      <div>
        <h3 className="font-medium text-sm">{ratingText}</h3>
        <p className="text-xs opacity-90">{subtext}</p>
      </div>
    </div>
  )
}
