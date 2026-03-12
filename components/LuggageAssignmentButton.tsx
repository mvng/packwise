'use client'

import { useState, useRef, useEffect } from 'react'
import type { TripLuggage, LuggageType } from '@/types/luggage'

interface Props {
  currentLuggageId: string | null | undefined
  tripLuggages: TripLuggage[]
  onAssign: (luggageId: string | null) => void
  itemName: string
}

const luggageIcons: Record<LuggageType, string> = {
  backpack: '🎒',
  'carry-on': '🧳',
  checked: '💼',
  trunk: '📦',
  other: '👜',
}

export default function LuggageAssignmentButton({ currentLuggageId, tripLuggages, onAssign, itemName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const currentLuggage = tripLuggages.find(tl => tl.id === currentLuggageId)
  const currentIcon = currentLuggage ? luggageIcons[currentLuggage.luggage.type as LuggageType] : '☐'

  const handleSelect = (luggageId: string | null) => {
    onAssign(luggageId)
    setIsOpen(false)
  }

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
          className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-colors"
          aria-label="Assign to luggage"
        >
          {currentIcon}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
              <div className="bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pt-2 pb-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-lg">Move &quot;{itemName}&quot; to:</h3>
                </div>

                {/* Luggage Cards */}
                <div className="p-6 space-y-3">
                  {tripLuggages.map((tl) => {
                    const isSelected = tl.id === currentLuggageId
                    return (
                      <button
                        key={tl.id}
                        onClick={() => handleSelect(tl.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-3xl">{luggageIcons[tl.luggage.type as LuggageType]}</div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{tl.luggage.name}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {tl.luggage.type}
                            {tl.luggage.capacity && ` • ${tl.luggage.capacity}L`}
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </button>
                    )
                  })}

                  {/* No Bag Option */}
                  <button
                    onClick={() => handleSelect(null)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      !currentLuggageId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-3xl">☐</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">No bag</div>
                      <div className="text-sm text-gray-500">Unassign from luggage</div>
                    </div>
                    {!currentLuggageId && (
                      <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Cancel Button */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 text-blue-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // Desktop: Popover
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-colors"
        aria-label="Assign to luggage"
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-10 z-30 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-in fade-in zoom-in-95 duration-200"
          style={{ transformOrigin: 'top right' }}
        >
          {tripLuggages.map((tl) => {
            const isSelected = tl.id === currentLuggageId
            return (
              <button
                key={tl.id}
                onClick={() => handleSelect(tl.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl">{luggageIcons[tl.luggage.type as LuggageType]}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 text-sm">{tl.luggage.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {tl.luggage.type}
                    {tl.luggage.capacity && ` • ${tl.luggage.capacity}L`}
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </button>
            )
          })}

          {/* Separator */}
          <div className="my-2 border-t border-gray-200" />

          {/* No Bag Option */}
          <button
            onClick={() => handleSelect(null)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl">☐</div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 text-sm">No bag</div>
            </div>
            {!currentLuggageId && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
