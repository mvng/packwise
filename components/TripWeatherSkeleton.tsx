export default function TripWeatherSkeleton({ variant = 'card' }: { variant?: 'card' | 'detail' }) {
  if (variant === 'card') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div>
              <div className="h-3 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Detail variant
  return (
    <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 animate-pulse">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 bg-blue-200 rounded flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-3 w-32 bg-blue-200 rounded mb-1"></div>
            <div className="h-2 w-40 bg-blue-100 rounded"></div>
          </div>
        </div>
        <div className="w-4 h-4 bg-blue-200 rounded"></div>
      </div>
    </div>
  )
}
