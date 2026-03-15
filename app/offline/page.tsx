'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">You are offline</h1>
      <p className="text-gray-500 mb-8 max-w-md text-center">
        It looks like you've lost your internet connection. We've queued any changes you've made, and they will automatically sync when you're back online.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
