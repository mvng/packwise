'use client'

import type { DayActivity, ActivityType } from './OutfitPlanner'
import type { AssignableItem, ItemOutfitAssignment } from './OutfitItemAssigner'

interface DayViewModalProps {
  days: DayActivity[]
  items: AssignableItem[]
  assignments: Record<string, ItemOutfitAssignment>
  hasLaundry: boolean
  laundryMidpoint?: string
  onClose: () => void
}

const ACTIVITY_LABELS: Record<ActivityType, { label: string; emoji: string; bg: string; text: string }> = {
  casual:  { label: 'Casual',          emoji: '\ud83d\udc55', bg: 'bg-gray-100',   text: 'text-gray-700'  },
  outdoor: { label: 'Outdoor / Sweaty', emoji: '\ud83c\udfc3', bg: 'bg-green-100', text: 'text-green-700' },
  formal:  { label: 'Formal / Event',   emoji: '\ud83d\udc54', bg: 'bg-purple-100', text: 'text-purple-700' },
}

function getItemsForDay(day: DayActivity, items: AssignableItem[], assignments: Record<string, ItemOutfitAssignment>) {
  return items.filter(item => {
    const asgn = assignments[item.id]
    if (!asgn) return false
    if (asgn.everyDay) return true
    if (!asgn.types || asgn.types.length === 0) return false
    return asgn.types.some(t => day.types.includes(t))
  })
}

export default function DayViewModal({
  days,
  items,
  assignments,
  hasLaundry,
  laundryMidpoint,
  onClose,
}: DayViewModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Day-by-Day View</h2>
            <p className="text-xs text-gray-500">What you\'ll wear and use each day</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl focus:outline-none focus:ring-2 focus:ring-gray-400 rounded px-1"
            aria-label="Close"
          >\u00d7</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {days.map((day, idx) => {
            const dayItems = getItemsForDay(day, items, assignments)
            const isLaundryDay = hasLaundry && laundryMidpoint && day.date === laundryMidpoint

            return (
              <div key={day.date}>
                {/* Day card */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {/* Day header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{day.label}</p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {day.types.map(t => (
                          <span
                            key={t}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTIVITY_LABELS[t].bg} ${ACTIVITY_LABELS[t].text}`}
                          >
                            {ACTIVITY_LABELS[t].emoji} {ACTIVITY_LABELS[t].label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{dayItems.length} item{dayItems.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Items */}
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4 py-3">No items assigned to this day\'s activities yet</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {dayItems.map(item => {
                        const asgn = assignments[item.id]
                        return (
                          <li key={item.id} className="flex items-center justify-between px-4 py-2">
                            <div>
                              <span className="text-sm text-gray-800">{item.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{item.categoryName}</span>
                            </div>
                            {asgn?.everyDay && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">every day</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                {/* Laundry divider after this day */}
                {isLaundryDay && (
                  <div className="flex items-center gap-3 my-3 px-2">
                    <div className="flex-1 h-px bg-blue-200" />
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      \ud83e\uddf7 Laundry \u2014 items reset after this point
                    </span>
                    <div className="flex-1 h-px bg-blue-200" />
                  </div>
                )}
              </div>
            )
          })}

          {Object.values(assignments).filter(a => !a.everyDay && (!a.types || a.types.length === 0)).length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">\u26a0\ufe0f Not assigned to any outfit</p>
              <ul className="space-y-1">
                {items
                  .filter(item => {
                    const a = assignments[item.id]
                    return !a || (!a.everyDay && (!a.types || a.types.length === 0))
                  })
                  .map(item => (
                    <li key={item.id} className="text-xs text-amber-600">{item.name} <span className="text-amber-400">\u2014 {item.categoryName}</span></li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
