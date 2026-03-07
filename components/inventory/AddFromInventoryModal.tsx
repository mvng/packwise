'use client'

import { useState, useEffect, useTransition } from 'react'
import { getUserInventory, addInventoryItemsToTrip } from '@/actions/inventory.actions'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  isFavorite: boolean
  notes: string | null
}

interface InventoryCategory {
  id: string
  name: string
  items: InventoryItem[]
}

interface Props {
  tripId: string
  onClose: () => void
  onAdded: () => void
}

export default function AddFromInventoryModal({ tripId, onClose, onAdded }: Props) {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getUserInventory().then((result) => {
      if (result.categories) setCategories(result.categories as InventoryCategory[])
      setLoading(false)
    })
  }, [])

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0)

  const handleAdd = () => {
    if (selected.size === 0) return
    setError(null)

    const itemsToAdd: Array<{
      inventoryItemId: string
      categoryName: string
      name: string
      quantity: number
    }> = []

    for (const cat of categories) {
      for (const item of cat.items) {
        if (selected.has(item.id)) {
          itemsToAdd.push({
            inventoryItemId: item.id,
            categoryName: cat.name,
            name: item.name,
            quantity: item.quantity,
          })
        }
      }
    }

    startTransition(async () => {
      const result = await addInventoryItemsToTrip(tripId, itemsToAdd)
      if (result.error) {
        setError(result.error)
      } else {
        onAdded()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Add from Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50 flex-shrink-0">
          <input
            type="text"
            placeholder="Search your items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Loading inventory…</div>
          )}
          {!loading && filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {search
                  ? `No items match "${search}"`
                  : 'Your inventory is empty. Add items at /inventory first.'}
              </p>
            </div>
          )}
          {filteredCategories.map((cat) => (
            <div key={cat.id}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {cat.name}
              </h4>
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors select-none ${
                      selected.has(item.id)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                    />
                    <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                    {item.isFavorite && <span className="text-xs opacity-70">⭐</span>}
                    <span className="text-xs text-gray-400 flex-shrink-0">×{item.quantity}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-100 text-red-700 text-sm flex-shrink-0">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 text-sm py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0 || isPending}
            className="flex-1 text-sm py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isPending
              ? 'Adding…'
              : `Add ${selected.size > 0 ? selected.size : ''} Item${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
