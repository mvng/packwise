'use client'

import { useState, useEffect } from 'react'

type ActivityType = 'casual' | 'outdoor' | 'formal'

interface DayActivity {
  date: string
  label: string
  type: ActivityType
}

interface OutfitPlannerProps {
  startDate: string
  endDate: string
  onChange?: (days: DayActivity[]) => void
}

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; emoji: string; color: string }[] = [
  { type: 'casual', label: 'Casual', emoji: '👕', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { type: 'outdoor', label: 'Outdoor / Sweaty', emoji: '🏃', color: 'bg-green-100 text-green-700 border-green-300' },
  { type: 'formal', label: 'Formal / Event', emoji: '👔', color: 'bg-purple-100 text-purple-700 border-purple-300' },
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

export function calcOutfitSummary(days: DayActivity[], hasLaundry: boolean, laundryMidpoint?: string): OutfitSummary {
  const totalDays = days.length
  let outdoor = days.filter(d => d.type === 'outdoor').length
  let formal = days.filter(d => d.type === 'formal').length
  let casual = days.filter(d => d.type === 'casual').length

  if (hasLaundry && laundryMidpoint) {
    // Days after laundry can re-use, so halve casual & outdoor counts for that portion
    const afterLaundry = days.filter(d => d.date > laundryMidpoint)
    const outdoorAfter = afterLaundry.filter(d => d.type === 'outdoor').length
    const casualAfter = afterLaundry.filter(d => d.type === 'casual').length
    outdoor = outdoor - Math.floor(outdoorAfter / 2)
    casual = casual - Math.floor(casualAfter / 2)
  }

  return {
    casual: Math.max(1, casual),
    outdoor: Math.max(0, outdoor),
    formal: Math.max(0, formal),
    underwear: totalDays + 1,
    totalDays,
  }
}

export default function OutfitPlanner({ startDate, endDate, onChange }: OutfitPlannerProps) {
  const dates = getDaysBetween(startDate, endDate)
  const [days, setDays] = useState<DayActivity[]>(
    dates.map(date => ({ date, label: formatDayLabel(date), type: 'casual' }))
  )
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    onChange?.(days)
  }, [days])

  const setDayType = (index: number, type: ActivityType) => {
    setDays(prev => prev.map((d, i) => i === index ? { ...d, type } : d))
  }

  const counts = {
    casual: days.filter(d => d.type === 'casual').length,
    outdoor: days.filter(d => d.type === 'outdoor').length,
    formal: days.filter(d => d.type === 'formal').length,
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
              {counts.outdoor > 0 && `${counts.outdoor} outdoor · `}
              {counts.formal > 0 && `${counts.formal} formal · `}
              {counts.casual} casual
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {days.map((day, i) => (
            <div key={day.date} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-28 shrink-0">{day.label}</span>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setDayType(i, opt.type)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                      day.type === opt.type
                        ? opt.color + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
