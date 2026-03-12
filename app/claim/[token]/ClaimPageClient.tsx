'use client'

import { useState, useTransition, useEffect } from 'react'
import { submitGuestChanges } from '@/actions/packing.actions'
import { User, Check, Plus, X, Share2, Save, LogOut } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClaimPageClient({ list, token }: { list: any; token: string }) {
  const [guestName, setGuestName] = useState<string>('')
  const [isNameSet, setIsNameSet] = useState(false)

  // Staging state
  const [stagedClaims, setStagedClaims] = useState<Record<string, string | null>>({})
  const [stagedNewItems, setStagedNewItems] = useState<{ id: string; categoryId: string; name: string; quantity: number }[]>([])

  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [newItemName, setNewItemName] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)

  useEffect(() => {
    const savedName = localStorage.getItem('packwise_guest_name')
    if (savedName) {
      setGuestName(savedName)
      setIsNameSet(true)
    }
  }, [])

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) return
    localStorage.setItem('packwise_guest_name', guestName.trim())
    setIsNameSet(true)
  }

  const handleClaim = (itemId: string) => {
    if (!isNameSet) {
      alert("Please enter your name first at the top of the page.")
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setStagedClaims(prev => ({ ...prev, [itemId]: guestName }))
    setSaveSuccess(false)
  }

  const handleUnclaim = (itemId: string) => {
    setStagedClaims(prev => ({ ...prev, [itemId]: null }))
    setSaveSuccess(false)
  }

  const handleAddItem = (categoryId: string) => {
    if (!isNameSet) {
      alert("Please enter your name first.")
      return
    }
    const name = newItemName[categoryId]?.trim()
    if (!name) return

    setStagedNewItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), categoryId, name, quantity: 1 }
    ])
    setNewItemName(prev => ({ ...prev, [categoryId]: '' }))
    setAddingTo(null)
    setSaveSuccess(false)
  }

  const handleDeleteStagedItem = (id: string) => {
    setStagedNewItems(prev => prev.filter(item => item.id !== id))
    setSaveSuccess(false)
  }

  const handleSave = () => {
    if (Object.keys(stagedClaims).length === 0 && stagedNewItems.length === 0) return

    startTransition(async () => {
      const claimsToSubmit = Object.entries(stagedClaims).map(([itemId, guestClaimant]) => ({
        itemId,
        guestClaimant
      }))

      const itemsToSubmit = stagedNewItems.map(item => ({
        categoryId: item.categoryId,
        name: item.name,
        quantity: item.quantity,
        guestName: guestName
      }))

      const result = await submitGuestChanges(token, claimsToSubmit, itemsToSubmit)
      if (result.success) {
        setStagedClaims({})
        setStagedNewItems([])
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(result.error || 'Failed to save changes')
        setTimeout(() => setSaveError(null), 3000)
      }
    })
  }

  const hasChanges = Object.keys(stagedClaims).length > 0 || stagedNewItems.length > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              {list.name}
            </h1>
            <p className="text-xs text-gray-500 mt-1">Shared Packing List for {list.trip.name || list.trip.destination}</p>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4 py-6">
        {!isNameSet ? (
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Join the trip</h2>
            <p className="text-sm text-gray-600 mb-4">Enter your name to claim items you're bringing.</p>
            <form onSubmit={handleSetName} className="flex gap-2">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Coach Sam"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg">
                {guestName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-indigo-900 font-medium">Claiming as <span className="font-bold">{guestName}</span></p>
                <button
                  onClick={() => {
                    localStorage.removeItem('packwise_guest_name')
                    setIsNameSet(false)
                    setGuestName('')
                    setStagedClaims({})
                    setStagedNewItems([])
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5"
                >
                  <LogOut className="w-3 h-3" /> Change name
                </button>
              </div>
            </div>
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" /> Saved!
              </span>
            )}
            {saveError && (
              <span className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-full">
                {saveError}
              </span>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {list.categories.map((category: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = category.items.map((item: any) => {
              // Override with staged claim if it exists
              if (stagedClaims[item.id] !== undefined) {
                return { ...item, guestClaimant: stagedClaims[item.id] }
              }
              return item
            })

            const newItemsForCategory = stagedNewItems.filter(item => item.categoryId === category.id)

            return (
              <article key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <header className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{category.name}</h3>
                </header>
                <div className="divide-y divide-gray-50">
                  <ul className="p-2 space-y-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {items.map((item: any) => {
                      const isClaimedByMe = item.guestClaimant === guestName
                      const isClaimedByOther = item.guestClaimant && item.guestClaimant !== guestName
                      const isClaimed = !!item.guestClaimant

                      return (
                        <li key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-gray-900 font-medium">{item.name}</span>
                            {item.quantity > 1 && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.quantity}x</span>}

                            {isClaimedByOther && (
                              <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 flex items-center gap-1">
                                <User className="w-3 h-3" /> {item.guestClaimant}
                              </span>
                            )}
                          </div>

                          <div>
                            {isClaimedByMe ? (
                              <button
                                onClick={() => handleUnclaim(item.id)}
                                disabled={!isNameSet}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <Check className="w-4 h-4" /> I'm bringing this
                              </button>
                            ) : !isClaimedByOther && (
                              <button
                                onClick={() => handleClaim(item.id)}
                                disabled={!isNameSet}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${
                                  !isNameSet ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200' : 'text-indigo-600 bg-white border-indigo-200 hover:bg-indigo-50'
                                }`}
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}

                    {newItemsForCategory.map(item => (
                      <li key={item.id} className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100/50">
                        <div className="flex items-center gap-3">
                          <span className="text-green-900 font-medium">{item.name}</span>
                          <span className="text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Bringing
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteStagedItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="p-4 bg-gray-50/50">
                    {addingTo === category.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="What else are you bringing?"
                          value={newItemName[category.id] || ''}
                          onChange={(e) => setNewItemName(prev => ({ ...prev, [category.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id)}
                          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddItem(category.id)}
                          className="text-sm px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingTo(null)}
                          className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isNameSet) alert("Please enter your name first.")
                          else setAddingTo(category.id)
                        }}
                        className={`text-sm font-medium flex items-center gap-1.5 ${
                          !isNameSet ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'
                        }`}
                      >
                        <Plus className="w-4 h-4" /> Add something I'm bringing
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      {/* Floating Action Bar for Saving Changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-[800px] mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Unsaved changes</p>
              <p className="text-xs text-gray-500">
                {Object.keys(stagedClaims).length} claim{Object.keys(stagedClaims).length !== 1 ? 's' : ''}, {stagedNewItems.length} new item{stagedNewItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Confirm Changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
