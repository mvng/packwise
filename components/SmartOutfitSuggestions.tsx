'use client'

interface OutfitCounts {
  casual: number
  outdoor: number
  formal: number
  underwear: number
  totalDays: number
}

interface SmartOutfitSuggestionsProps {
  outfits: OutfitCounts
  avgTempF?: number
  tripType?: string
}

interface Suggestion {
  emoji: string
  text: string
  category: 'outdoor' | 'formal' | 'casual' | 'weather'
}

function getSuggestions(outfits: OutfitCounts, avgTempF?: number, tripType?: string): Suggestion[] {
  const suggestions: Suggestion[] = []

  if (outfits.outdoor > 0) {
    suggestions.push({ emoji: '👟', text: `Pack ${outfits.outdoor} moisture-wicking shirt${outfits.outdoor > 1 ? 's' : ''} for outdoor days`, category: 'outdoor' })
    suggestions.push({ emoji: '🧦', text: 'Bring extra athletic socks — at least 1 pair per outdoor day', category: 'outdoor' })
    if (avgTempF !== undefined && avgTempF > 75) {
      suggestions.push({ emoji: '💧', text: 'Hot weather detected — outdoor clothes cannot be re-worn; pack full sets', category: 'weather' })
    }
    if (outfits.outdoor >= 3) {
      suggestions.push({ emoji: '🎒', text: 'Consider compression packing cubes to save space for bulky activewear', category: 'outdoor' })
    }
  }

  if (outfits.formal > 0) {
    suggestions.push({ emoji: '👔', text: `Pack ${outfits.formal} complete formal outfit${outfits.formal > 1 ? 's' : ''} — no re-wearing these`, category: 'formal' })
    suggestions.push({ emoji: '👞', text: 'Dress shoes add ~1.5L; pack them in a shoe bag at the base of your luggage', category: 'formal' })
    if (outfits.formal === 1) {
      suggestions.push({ emoji: '🪢', text: 'Swap accessories (tie, belt, jewelry) to make one formal outfit feel different each time', category: 'formal' })
    }
  }

  if (outfits.casual > 0) {
    suggestions.push({ emoji: '👕', text: `${outfits.casual} casual outfit${outfits.casual > 1 ? 's' : ''} — neutral colors let you mix and match tops and bottoms`, category: 'casual' })
  }

  if (avgTempF !== undefined && avgTempF < 50) {
    suggestions.push({ emoji: '🧥', text: 'Cold weather — bring a packable down jacket that compresses small', category: 'weather' })
  }

  if (tripType === 'skiing' || tripType === 'ski') {
    suggestions.push({ emoji: '⛷️', text: 'Ski trips: base layers + mid layers matter more than full outfit changes', category: 'outdoor' })
  }

  return suggestions
}

export default function SmartOutfitSuggestions({ outfits, avgTempF, tripType }: SmartOutfitSuggestionsProps) {
  const suggestions = getSuggestions(outfits, avgTempF, tripType)

  if (suggestions.length === 0) return null

  const categoryColors: Record<string, string> = {
    outdoor: 'bg-green-50 border-green-200',
    formal: 'bg-purple-50 border-purple-200',
    casual: 'bg-gray-50 border-gray-200',
    weather: 'bg-amber-50 border-amber-200',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">✨</span>
        <div>
          <h3 className="font-semibold text-gray-900">Smart Outfit Suggestions</h3>
          <p className="text-xs text-gray-500">Personalized to your activity mix{avgTempF !== undefined ? ` · avg ${avgTempF}°F` : ''}</p>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${categoryColors[s.category]}`}
          >
            <span className="text-base shrink-0">{s.emoji}</span>
            <span className="text-gray-700">{s.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-700 font-medium">📦 Outfit Summary</p>
        <p className="text-sm text-blue-900 mt-1">
          {outfits.outdoor > 0 && `${outfits.outdoor} outdoor · `}
          {outfits.formal > 0 && `${outfits.formal} formal · `}
          {outfits.casual} casual · {outfits.underwear} underwear/socks
        </p>
      </div>
    </div>
  )
}
