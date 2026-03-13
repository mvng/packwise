import { Lightbulb, PlusCircle } from 'lucide-react'

interface SmartSuggestionsProps {
  startDate: string | Date | null
  onSelect: (suggestion: { title: string, category: string, daysBefore: number }) => void
}

const SUGGESTIONS = [
  { title: 'Renew passport', category: 'DOCUMENTS', daysBefore: 30 },
  { title: 'Book pet care', category: 'PETS', daysBefore: 30 },
  { title: 'Prescription refill', category: 'HEALTH', daysBefore: 14 },
  { title: 'Travel insurance', category: 'DOCUMENTS', daysBefore: 14 },
  { title: 'Confirm hotel', category: 'LOGISTICS', daysBefore: 7 },
  { title: 'Pack medications', category: 'HEALTH', daysBefore: 7 },
  { title: 'Charge devices', category: 'LOGISTICS', daysBefore: 1 },
  { title: 'Confirm airport ride', category: 'LOGISTICS', daysBefore: 1 }
]

export default function SmartSuggestions({ startDate, onSelect }: SmartSuggestionsProps) {
  if (!startDate) return null

  const tripDate = new Date(startDate)
  const now = new Date()
  const daysUntilTrip = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Filter suggestions that make sense based on remaining time
  const relevantSuggestions = SUGGESTIONS.filter(
    s => daysUntilTrip > s.daysBefore - 5
  ).slice(0, 5)

  if (relevantSuggestions.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Suggested Pre-Trip Tasks
      </div>

      <div className="flex flex-wrap gap-2">
        {relevantSuggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-all shadow-sm"
          >
            <span>{suggestion.title}</span>
            <PlusCircle className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  )
}
