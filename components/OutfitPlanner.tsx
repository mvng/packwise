'use client'

import { useState, useEffect } from 'react'

export type ActivityType = 'casual' | 'outdoor' | 'formal'

export interface DayActivity {
  date: string
  label: string
  types: ActivityType[]  // multiple activities per day
}

interface OutfitPlannerProps {
  startDate: string
  endDate: string
  onChange?: (days: DayActivity[]) => void
}

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string; activeColor: string }[] = [
  { type: 'casual',  label: 'Casual',          emoji: '👕', activeColor: 'bg-gray-100 text-gray-700 border-gray-400' },
  { type: 'outdoor', label: 'Outdoor / Sweaty', emoji: '🏃', activeColor: 'bg-green-100 text-green-700 border-green-400' },
  { type: 'formal',  label: 'Formal / Event',   emoji: '👔', activeColor: 'bg-purple-100 text-purple-700 border-purple-400' },
]

function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export interface OutfitSummary {
  casual: number
  outdoor: number
  formal: number
  underwear: number
  totalDays: number
}

export function calcOutfitSummary(
  days: DayActivity[],
  hasLaundry: boolean,
  laundryMidpoint?: string
): OutfitSummary {
  const totalDays = days.length

  // Count each activity type across all days (a day with outdoor+formal = 1 outdoor + 1 formal)
  let outdoor = days.reduce((sum, d) => sum + (d.types.includes('outdoor') ? 1 : 0), 0)
  let formal  = days.reduce((sum, d) => sum + (d.types.includes('formal')  ? 1 : 0), 0)
  // Casual = days that have casual OR no formal/outdoor (pure casual days)
  let casual  = days.reduce((sum, d) => sum + (d.types.includes('casual')  ? 1 : 0), 0)

  if (hasLaundry && laundryMidpoint) {
    const afterLaundry = days.filter(d => d.date > laundryMidpoint)
    const outdoorAfter = afterLaundry.filter(d => d.types.includes('outdoor')).length
    const casualAfter  = afterLaundry.filter(d => d.types.includes('casual')).length
    outdoor = outdoor - Math.floor(outdoorAfter / 2)
    casual  = casual  - Math.floor(casualAfter  / 2)
  }

  return {
    casual:     Math.max(1, casual),
    outdoor:    Math.max(0, outdoor),
    formal:     Math.max(0, formal),
    underwear:  totalDays + 1,
    totalDays,
  }
}

export default function OutfitPlanner({ startDate, endDate, onChange }: OutfitPlannerProps) {
  const dates = getDaysBetween(startDate, endDate)
  const [days, setDays] = useState<DayActivity[]>(
    dates.map(date => ({ date, label: formatDayLabel(date), types: ['casual'] }))
  )
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    onChange?.(days)
  }, [days])

  const toggleDayType = (index: number, type: ActivityType) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== index) return d
      const has = d.types.includes(type)
      let next: ActivityType[]
      if (has) {
        // Don't allow removing the last activity
        next = d.types.length > 1 ? d.types.filter(t => t !== type) : d.types
      } else {
        next = [...d.types, type]
      }
      return { ...d, types: next }
    }))
  }

  const totalOutfits = days.reduce((sum, d) => sum + d.types.length, 0)
  const counts = {
    casual:  days.filter(d => d.types.includes('casual')).length,
    outdoor: days.filter(d => d.types.includes('outdoor')).length,
    formal:  days.filter(d => d.types.includes('formal')).length,
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div>
            <h3 className="font-semibold text-gray-900">Activity Day Planner</h3>
            <p className="text-xs text-gray-500">
              {totalOutfits} outfit{totalOutfits !== 1 ? 's' : ''} total
              {counts.outdoor > 0 && ` · ${counts.outdoor} outdoor`}
              {counts.formal  > 0 && ` · ${counts.formal} formal`}
              {counts.casual  > 0 && ` · ${counts.casual} casual`}
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-400">Select all activity types for each day — multiple allowed</p>
          {days.map((day, i) => (
            <div key={day.date} className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-28 shrink-0 pt-1">{day.label}</span>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_OPTIONS.map(opt => {
                  const active = day.types.includes(opt.type)
                  return (
                    <button
                      key={opt.type}
                      onClick={() => toggleDayType(i, opt.type)}
                      className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                        active
                          ? opt.activeColor + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  )
                })}
                {day.types.length > 1 && (
                  <span className="text-xs text-gray-400 self-center">
                    {day.types.length} outfits
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
