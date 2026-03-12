'use client'

import { useMemo } from 'react'

interface TripCountdownProps {
  startDate: Date | string | null
  endDate?: Date | string | null
  variant?: 'card' | 'detail'
}

export default function TripCountdown({ startDate, endDate, variant = 'card' }: TripCountdownProps) {
  const countdown = useMemo(() => {
    if (!startDate) return null

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(startDate)
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())

    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntil = Math.round((startDay.getTime() - today.getTime()) / msPerDay)

    if (daysUntil < 0 && endDate) {
      const end = new Date(endDate)
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      const daysLeft = Math.round((endDay.getTime() - today.getTime()) / msPerDay)
      if (daysLeft >= 0) return { state: 'ongoing' as const, daysLeft }
      return { state: 'past' as const }
    }

    if (daysUntil < 0) return { state: 'past' as const }
    if (daysUntil === 0) return { state: 'today' as const }
    if (daysUntil === 1) return { state: 'tomorrow' as const }
    return { state: 'future' as const, daysUntil }
  }, [startDate, endDate])

  if (!countdown) return null

  if (variant === 'card') {
    if (countdown.state === 'past') return null
    if (countdown.state === 'today') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        🛫 Today!
      </span>
    )
    if (countdown.state === 'tomorrow') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
        ⏰ Tomorrow
      </span>
    )
    if (countdown.state === 'ongoing') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        ✈️ In progress · {countdown.daysLeft}d left
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
        🗓 {countdown.daysUntil} days away
      </span>
    )
  }

  // detail variant
  if (countdown.state === 'past') return null
  if (countdown.state === 'today') return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
      <span className="text-xl">🛫</span>
      <div>
        <p className="text-sm font-bold text-green-800">Your trip starts today!</p>
        <p className="text-xs text-green-600">Have an amazing trip ✨</p>
      </div>
    </div>
  )
  if (countdown.state === 'tomorrow') return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
      <span className="text-xl">⏰</span>
      <div>
        <p className="text-sm font-bold text-orange-800">Leaving tomorrow!</p>
        <p className="text-xs text-orange-600">Time to finish packing 🧳</p>
      </div>
    </div>
  )
  if (countdown.state === 'ongoing') return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
      <span className="text-xl">✈️</span>
      <div>
        <p className="text-sm font-bold text-blue-800">Trip in progress</p>
        <p className="text-xs text-blue-600">{countdown.daysLeft} day{countdown.daysLeft !== 1 ? 's' : ''} remaining</p>
      </div>
    </div>
  )
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
      <span className="text-xl">🗓</span>
      <div>
        <p className="text-sm font-bold text-gray-800">{countdown.daysUntil} days to go</p>
        <p className="text-xs text-gray-500">Get that packing list ready</p>
      </div>
    </div>
  )
}
