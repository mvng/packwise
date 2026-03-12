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

  // Basic logic for rating
  let ratingText = "Looking good!"
  let ratingColor = "bg-green-50 border-green-200 text-green-800"
  let icon = "✅"
  let subtext = `You have packed a solid amount of clothing (${clothingCount} items) for a ${duration}-day trip.`

  if (clothingCount === 0) {
    return null // Not enough data or no clothing category yet
  }

  if (clothingCount < duration) {
    ratingText = "Underpacking alert"
    ratingColor = "bg-amber-50 border-amber-200 text-amber-800"
    icon = "⚠️"
    subtext = `You might be underpacking! You have ${clothingCount} clothing items for a ${duration}-day trip.`
  } else if (clothingCount > duration * 3) {
    ratingText = "Overpacking alert"
    ratingColor = "bg-blue-50 border-blue-200 text-blue-800"
    icon = "🧳"
    subtext = `You might be overpacking. You have ${clothingCount} clothing items for just a ${duration}-day trip.`
  }

  return (
    <div className={`rounded-2xl border p-4 mb-6 flex items-start gap-4 ${ratingColor}`}>
      <div className="text-2xl mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold">{ratingText}</h3>
        <p className="text-sm opacity-90 mt-1">{subtext}</p>
      </div>
    </div>
  )
}
