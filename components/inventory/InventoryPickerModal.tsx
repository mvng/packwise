'use client'

import { useState, useTransition, useMemo } from 'react'
import { getUserInventory, addInventoryItemsToTrip } from '@/actions/inventory.actions'
import type { InventoryCategoryData, InventoryItemData } from '@/types/inventory'

interface InventoryPickerModalProps {
  tripId: string
  onClose: () => void
  onSuccess: (count: number) => void
}

export default function InventoryPickerModal({
  tripId,
  onClose,
  onSuccess,
}: InventoryPickerModalProps) {
  const [categories, setCategories] = useState<InventoryCategoryData[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load inventory on mount
  useState(() => {
    getUserInventory().then((result) => {
      if ('error' in result) {
        setError(result.error)
      } else {
        setCategories(result.categories ?? [])
      }
      setLoading(false)
    })
  })

  const filteredCategories = useMemo(() => {
    if (!categories) return []
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [categories, search])

  const allItems = useMemo(
    () => (categories ?? []).flatMap((c) => c.items),
    [categories]
  )

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    const visible = filteredCategories.flatMap((c) => c.items).map((i) => i.id)
    const allSelected = visible.every((id) => selected.has(id))
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        visible.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        visible.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function handleAdd() {
    if (selected.size === 0) return
    setError(null)
    startTransition(async () => {
      const result = await addInventoryItemsToTrip(tripId, Array.from(selected))
      if ('error' in result) {
        setError(result.error)
      } else {
        onSuccess(result.count)
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">Add from Inventory</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select items to add to this trip</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>
          ) : allItems.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎒</div>
              <p className="text-sm text-gray-500 mb-2">Your inventory is empty.</p>
              <a
                href="/inventory"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Build your inventory →
              </a>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No items match &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select all visible */}
              {filteredCategories.flatMap((c) => c.items).length > 1 && (
                <button
                  onClick={toggleAll}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  {filteredCategories.flatMap((c) => c.items).every((i) => selected.has(i.id))
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              )}
              {filteredCategories.map((cat) => (
                <div key={cat.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {cat.name}
                  </p>
                  <div className="space-y-1">
                    {cat.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800 font-medium truncate">
                              {item.name}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                ×{item.quantity}
                              </span>
                            )}
                            {item.isFavorite && (
                              <span className="text-xs flex-shrink-0">⭐</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          {error && isPending === false && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0 || isPending}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
            >
              {isPending
                ? 'Adding…'
                : selected.size === 0
                ? 'Select items'
                : `Add ${selected.size} item${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
