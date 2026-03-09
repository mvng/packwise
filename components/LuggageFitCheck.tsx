'use client'

interface LuggageInfo {
  name: string
  capacityLiters: number
}

interface OutfitCounts {
  casual: number
  outdoor: number
  formal: number
  underwear: number
}

interface LuggageFitCheckProps {
  luggages: LuggageInfo[]
  outfits: OutfitCounts
}

// Estimated volume per outfit type in liters
const OUTFIT_VOLUMES: Record<string, number> = {
  casual: 1.5,   // t-shirt + pants/shorts
  outdoor: 2.0,  // activewear, thicker fabrics
  formal: 3.0,   // dress shirt, blazer, or dress
  underwear: 0.3, // per pair
}

function calcOutfitVolume(outfits: OutfitCounts): number {
  return (
    outfits.casual * OUTFIT_VOLUMES.casual +
    outfits.outdoor * OUTFIT_VOLUMES.outdoor +
    outfits.formal * OUTFIT_VOLUMES.formal +
    outfits.underwear * OUTFIT_VOLUMES.underwear
  )
}

export default function LuggageFitCheck({ luggages, outfits }: LuggageFitCheckProps) {
  const totalCapacity = luggages.reduce((sum, l) => sum + l.capacityLiters, 0)
  // Reserve ~60% of luggage for clothing; rest for toiletries, shoes, gear
  const clothingBudget = Math.round(totalCapacity * 0.6)
  const outfitVolume = Math.round(calcOutfitVolume(outfits))
  const fits = outfitVolume <= clothingBudget
  const pct = Math.round((outfitVolume / clothingBudget) * 100)

  if (luggages.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🧳</span>
        <div>
          <h3 className="font-semibold text-gray-900">Luggage Fit Check</h3>
          <p className="text-xs text-gray-500">
            {luggages.map(l => l.name).join(' + ')} · {totalCapacity}L total
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Outfit volume</span>
          <span className={`font-medium ${fits ? 'text-green-600' : 'text-red-500'}`}>
            ~{outfitVolume}L / {clothingBudget}L clothing budget
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${
              fits ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
        fits ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        <span>{fits ? '✅' : '⚠️'}</span>
        <span>
          {fits
            ? `Your outfits fit with ${clothingBudget - outfitVolume}L to spare for shoes & toiletries.`
            : `You're over by ~${outfitVolume - clothingBudget}L. Consider enabling laundry or reducing casual days.`
          }
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>👕 {outfits.casual} casual · ~{Math.round(outfits.casual * OUTFIT_VOLUMES.casual)}L</div>
        <div>🏃 {outfits.outdoor} outdoor · ~{Math.round(outfits.outdoor * OUTFIT_VOLUMES.outdoor)}L</div>
        <div>👔 {outfits.formal} formal · ~{Math.round(outfits.formal * OUTFIT_VOLUMES.formal)}L</div>
        <div>🧦 {outfits.underwear} underwear · ~{Math.round(outfits.underwear * OUTFIT_VOLUMES.underwear)}L</div>
      </div>
    </div>
  )
}
