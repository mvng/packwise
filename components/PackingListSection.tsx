'use client'

import { useState, useTransition } from 'react'
import { toggleItemPacked, addCustomItem, deleteItem } from '@/actions/packing.actions'
import InventoryPickerModal from '@/components/inventory/InventoryPickerModal'

interface PackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
}

interface Category {
  id: string
  name: string
  order: number
  items: PackingItem[]
}

interface PackingList {
  id: string
  name: string
  categories: Category[]
}

interface Trip {
  id: string
  packingLists: PackingList[]
}

export default function PackingListSection({ trip }: { trip: Trip }) {
  const [lists, setLists] = useState(trip.packingLists)
  const [newItemName, setNewItemName] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [showInventoryPicker, setShowInventoryPicker] = useState(false)
  const [inventoryToast, setInventoryToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleToggle = (
    itemId: string,
    categoryId: string,
    packingListId: string,
    isPacked: boolean
  ) => {
    startTransition(async () => {
      await toggleItemPacked(itemId, !isPacked, trip.id)
      setLists((prev) =>
        prev.map((list) =>
          list.id === packingListId
            ? {
                ...list,
                categories: list.categories.map((cat) =>
                  cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map((item) =>
                          item.id === itemId ? { ...item, isPacked: !isPacked } : item
                        ),
                      }
                    : cat
                ),
              }
            : list
        )
      )
    })
  }

  const handleAddItem = async (categoryId: string, packingListId: string) => {
    const name = newItemName[categoryId]?.trim()
    if (!name) return

    setAddError(null)
    const result = await addCustomItem(categoryId, name, 1, trip.id)

    if (result.error) {
      setAddError(result.error)
    } else if (result.item) {
      setLists((prev) =>
        prev.map((list) =>
          list.id === packingListId
            ? {
                ...list,
                categories: list.categories.map((cat) =>
                  cat.id === categoryId
                    ? { ...cat, items: [...cat.items, result.item!] }
                    : cat
                ),
              }
            : list
        )
      )
      setNewItemName((prev) => ({ ...prev, [categoryId]: '' }))
      setAddingTo(null)
    }
  }

  const handleDelete = (itemId: string, categoryId: string, packingListId: string) => {
    startTransition(async () => {
      await deleteItem(itemId, trip.id)
      setLists((prev) =>
        prev.map((list) =>
          list.id === packingListId
            ? {
                ...list,
                categories: list.categories.map((cat) =>
                  cat.id === categoryId
                    ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
                    : cat
                ),
              }
            : list
        )
      )
    })
  }

  function handleInventorySuccess(count: number) {
    setInventoryToast(`${count} item${count !== 1 ? 's' : ''} added to your packing list`)
    setTimeout(() => setInventoryToast(null), 3500)
    // Trigger a full page refresh so the new server-rendered items appear
    window.location.reload()
  }

  if (!lists.length) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-900 mb-2">No packing list yet</h3>
          <p className="text-gray-500 text-sm">
            Create a new trip with auto-generated suggestions to get started.
          </p>
        </div>
        <button
          onClick={() => setShowInventoryPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors"
        >
          🎒 Add from Inventory
        </button>
        {showInventoryPicker && (
          <InventoryPickerModal
            tripId={trip.id}
            onClose={() => setShowInventoryPicker(false)}
            onSuccess={handleInventorySuccess}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {addError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {addError}
        </div>
      )}

      {/* Inventory toast */}
      {inventoryToast && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>✓ {inventoryToast}</span>
          <button
            onClick={() => setInventoryToast(null)}
            className="text-green-400 hover:text-green-600 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Add from Inventory button */}
      <button
        onClick={() => setShowInventoryPicker(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors"
      >
        🎒 Add from Inventory
      </button>

      {lists.map((list) => (
        <div key={list.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">{list.name}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {list.categories.map((category) => (
              <div key={category.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {category.name}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {category.items.filter((i) => i.isPacked).length}/{category.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group">
                      <button
                        onClick={() =>
                          handleToggle(item.id, category.id, list.id, item.isPacked)
                        }
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-all ${
                          item.isPacked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {item.isPacked && (
                          <svg
                            className="w-3 h-3 text-white m-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          item.isPacked ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {item.quantity > 1 && (
                          <span className="font-medium mr-1">{item.quantity}x</span>
                        )}
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id, category.id, list.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
                        aria-label={`Remove ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {addingTo === category.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={newItemName[category.id] || ''}
                      onChange={(e) =>
                        setNewItemName((prev) => ({ ...prev, [category.id]: e.target.value }))
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleAddItem(category.id, list.id)
                      }
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddItem(category.id, list.id)}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingTo(null)
                        setAddError(null)
                      }}
                      className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(category.id)}
                    className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    + Add item
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {showInventoryPicker && (
        <InventoryPickerModal
          tripId={trip.id}
          onClose={() => setShowInventoryPicker(false)}
          onSuccess={handleInventorySuccess}
        />
      )}
    </div>
  )
}
