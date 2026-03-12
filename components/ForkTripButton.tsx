'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { forkTrip } from '@/actions/trip.actions'
import { getTripLocalStorageState } from '@/components/PackingListSection'

interface ForkTripButtonProps {
  tripId: string
  isAuthenticated: boolean
  variant?: 'primary' | 'secondary'
}

export default function ForkTripButton({ 
  tripId, 

  isAuthenticated,
  variant = 'primary'
}: ForkTripButtonProps) {
  const [isForking, setIsForking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleFork = async () => {
    if (!isAuthenticated) {
      // Store intended action and redirect to login
      sessionStorage.setItem('fork_trip_after_login', tripId)
      router.push(`/login?redirect=/trip/${tripId}`)
      return
    }

    setIsForking(true)
    setError(null)

    startTransition(async () => {
      // Get localStorage state for this trip (checked items from anonymous viewing)
      const localStorageState = getTripLocalStorageState(tripId)
      
      // Fork the trip with localStorage state
      const result = await forkTrip(tripId, localStorageState)

      if (result.error) {
        if (result.alreadyOwned) {
          setError('You already own this trip')
        } else if (result.requiresAuth) {
          sessionStorage.setItem('fork_trip_after_login', tripId)
          router.push(`/login?redirect=/trip/${tripId}`)
        } else {
          setError(result.error)
        }
        setIsForking(false)
      } else if (result.success && result.tripId) {
        setShowSuccess(true)
        
        // Clear localStorage for this trip after successful fork
        if (typeof window !== 'undefined' && localStorageState) {
          localStorage.removeItem(`packwise_trip_${tripId}`)
        }
        
        setTimeout(() => {
          router.push(`/trip/${result.tripId}`)
        }, 1500)
      }
    })
  }

  const buttonClasses = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
    : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'

  if (showSuccess) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Copied! Redirecting...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleFork}
        disabled={isForking || isPending}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
      >
        {isForking || isPending ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Copying...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{isAuthenticated ? 'Save a copy to my account' : 'Sign in to save a copy'}</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
