'use client'

import { useState, useEffect } from 'react'
import { packingAdvice } from '@/lib/packing-advice'

interface TripLoadingScreenProps {
  // We might not have the trip name yet if it's strictly a loading screen
  // before the trip data comes in, but we can pass a generic string or nothing.
}

export default function TripLoadingScreen({}: TripLoadingScreenProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Choose a random starting quote
  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * packingAdvice.length))
  }, [])

  // Cycle through random quotes every 3.5 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex(Math.floor(Math.random() * packingAdvice.length))
    }, 3500)

    return () => clearInterval(quoteInterval)
  }, [])

  // Simulate a smooth loading progress bar from 0 to 90%
  // It will unmount when the actual page loading is complete,
  // or jump to 100% just before unmounting if we wanted to get fancy.
  useEffect(() => {
    const duration = 2000 // Time to reach ~90% in ms
    const updateInterval = 50 // Update every 50ms
    const totalSteps = duration / updateInterval
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep++
      // Animate progress with an ease-out feel by slowing down as it gets closer to 90%
      const newProgress = 90 * (1 - Math.pow(1 - currentStep / totalSteps, 3))

      setProgress(Math.min(newProgress, 95)) // Cap at 95% until actually done

      if (currentStep >= totalSteps * 2) {
         // After it reaches the main target, let it slowly creep up
         setProgress(prev => Math.min(prev + 0.1, 99))
      }
    }, updateInterval)

    return () => clearInterval(progressInterval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">

        {/* Brand / Loading Element */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <span className="text-2xl z-10">✈️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Preparing your trip...
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Cycling Quotes */}
        <div className="h-24 flex items-center justify-center relative w-full overflow-hidden">
          {packingAdvice.map((quote, index) => (
            <p
              key={index}
              className={`absolute text-gray-600 italic text-lg px-4 transition-opacity duration-500 ease-in-out ${
                index === quoteIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              &quot;{quote}&quot;
            </p>
          ))}
        </div>

      </div>
    </div>
  )
}
