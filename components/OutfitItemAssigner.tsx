'use client'

import { useEffect, useState } from 'react'
import type { ActivityType, DayActivity } from './OutfitPlanner'

export interface AssignableItem {
  id: string
  name: string
  quantity: number
  categoryName: string
}

export interface ItemOutfitAssignment {
  itemId: string
  /** null = not assigned to any outfit (gear, toiletries bag, etc.) */
  types: ActivityType[] | null
  everyDay: boolean
}

interface OutfitItemAssignerProps {
  tripId: string
  items: AssignableItem[]
  days: DayActivity[]
  hasLaundry: boolean
  laundryMidpoint?: string
  onAssignmentsChange?: (assignments: ItemOutfitAssignment[]) => void
}

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string; activeColor: string }[] = [
  { type: 'casual',  label: 'Casual',          emoji: '\ud83d\udc55', activeColor: 'bg-gray-100 text-gray-700 border-gray-400' },
  { type: 'outdoor', label: 'Outdoor / Sweaty', emoji: '\ud83c\udfc3', activeColor: 'bg-green-100 text-green-700 border-green-400' },
  { type: 'formal',  label: 'Formal / Event',   emoji: '\ud83d\udc54', activeColor: 'bg-purple-100 text-purple-700 border-purple-400' },
]

const STORAGE_KEY = (tripId: string) => `packwise_outfit_assignments_${tripId}`

function calcItemQuantity(
  assignment: ItemOutfitAssignment,
  days: DayActivity[],
  hasLaundry: boolean,
  laundryMidpoint?: string
): number {
  if (!assignment.types || assignment.types.length === 0) return 1
  if (assignment.everyDay) {
    // Items used every day — laundry doesn't help (toothbrush, deodorant)
    return days.length
  }

  // Count days that match any of the assigned activity types
  const matchingDays = days.filter(d =>
    assignment.types!.some(t => d.types.includes(t))
  )
  let count = matchingDays.length

  if (hasLaundry && laundryMidpoint && count > 1) {
    const afterLaundry = matchingDays.filter(d => d.date > laundryMidpoint).length
    count = count - Math.floor(afterLaundry / 2)
  }

  return Math.max(1, count)
}

export default function OutfitItemAssigner({
  tripId,
  items,
  days,
  hasLaundry,
  laundryMidpoint,
  onAssignmentsChange,
}: OutfitItemAssignerProps) {
  const [assignments, setAssignments] = useState<Record<string, ItemOutfitAssignment>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY(tripId))
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY(tripId), JSON.stringify(assignments))
    onAssignmentsChange?.(Object.values(assignments))
  }, [assignments, tripId])

  const getAssignment = (itemId: string): ItemOutfitAssignment =>
    assignments[itemId] ?? { itemId, types: null, everyDay: false }

  const updateAssignment = (itemId: string, patch: Partial<ItemOutfitAssignment>) => {
    setAssignments(prev => ({
      ...prev,
      [itemId]: { ...getAssignment(itemId), ...patch, itemId },
    }))
  }

  const toggleType = (itemId: string, type: ActivityType) => {
    const current = getAssignment(itemId)
    const currentTypes = current.types ?? []
    const has = currentTypes.includes(type)
    const next = has
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    updateAssignment(itemId, { types: next.length > 0 ? next : null, everyDay: false })
  }

  const toggleEveryDay = (itemId: string) => {
    const current = getAssignment(itemId)
    updateAssignment(itemId, {
      everyDay: !current.everyDay,
      types: !current.everyDay ? ['casual', 'outdoor', 'formal'] : null,
    })
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.categoryName.toLowerCase().includes(search.toLowerCase())
  )

  const assignedCount = Object.values(assignments).filter(
    a => a.everyDay || (a.types && a.types.length > 0)
  ).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">\ud83d\udc57</span>
          <div>
            <h3 className="font-semibold text-gray-900">Outfit Item Assignment</h3>
            <p className="text-xs text-gray-500">
              {assignedCount > 0
                ? `${assignedCount}/${items.length} items assigned \u00b7 quantities auto-calculated`
                : `Assign items to outfit types to auto-calculate quantities`
              }
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '\u25b2 Hide' : '\u25bc Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-3">
            Tag each item with the outfit type(s) it belongs to. Quantities update automatically based on your day plan{hasLaundry ? ' and laundry schedule' : ''}.
          </p>

          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-2 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center w-16">Every day</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">\ud83d\udc55</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">\ud83c\udfc3</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">\ud83d\udc54</span>
            </div>

            {filtered.map(item => {
              const asgn = getAssignment(item.id)
              const qty = days.length > 0 && (asgn.everyDay || (asgn.types && asgn.types.length > 0))
                ? calcItemQuantity(asgn, days, hasLaundry, laundryMidpoint)
                : item.quantity
              const qtyChanged = qty !== item.quantity

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
                >
                  {/* Item name + category + qty badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 truncate">{item.name}</span>
                      {qtyChanged && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                          {qty}x
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{item.categoryName}</span>
                  </div>

                  {/* Every day toggle */}
                  <div className="flex justify-center w-16">
                    <button
                      onClick={() => toggleEveryDay(item.id)}
                      className={`w-8 h-8 rounded-full border-2 text-xs transition-all ${
                        asgn.everyDay
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-200 text-gray-300 hover:border-blue-300'
                      }`}
                      title="Used every day (toothbrush, sunscreen, etc.)"
                    >
                      \u221e
                    </button>
                  </div>

                  {/* Casual toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => !asgn.everyDay && toggleType(item.id, 'casual')}
                      disabled={asgn.everyDay}
                      className={`w-8 h-8 rounded-full border-2 text-xs transition-all ${
                        asgn.types?.includes('casual') && !asgn.everyDay
                          ? 'bg-gray-200 border-gray-400 text-gray-700'
                          : 'border-gray-200 text-gray-300 hover:border-gray-400'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      \u2022
                    </button>
                  </div>

                  {/* Outdoor toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => !asgn.everyDay && toggleType(item.id, 'outdoor')}
                      disabled={asgn.everyDay}
                      className={`w-8 h-8 rounded-full border-2 text-xs transition-all ${
                        asgn.types?.includes('outdoor') && !asgn.everyDay
                          ? 'bg-green-100 border-green-400 text-green-700'
                          : 'border-gray-200 text-gray-300 hover:border-green-300'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      \u2022
                    </button>
                  </div>

                  {/* Formal toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => !asgn.everyDay && toggleType(item.id, 'formal')}
                      disabled={asgn.everyDay}
                      className={`w-8 h-8 rounded-full border-2 text-xs transition-all ${
                        asgn.types?.includes('formal') && !asgn.everyDay
                          ? 'bg-purple-100 border-purple-400 text-purple-700'
                          : 'border-gray-200 text-gray-300 hover:border-purple-300'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      \u2022
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export { calcItemQuantity, STORAGE_KEY }
