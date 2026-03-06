'use client'

import { useState, useTransition } from 'react'
import { toggleItemPacked, addCustomItem, deleteItem } from '@/actions/packing.actions'

interface PackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
}

interface PackingList {
  id: string
  categoryId: string
  categoryName: string
  items: PackingItem[]
}

interface Trip {
  id: string
  packingLists: PackingList[]
}

export default function PackingListSection({ trip }: { trip: Trip }) {
  const [lists, setLists] = useState(trip.packingLists)
  const [newItemName, setNewItemName] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleToggle = (listId: string, itemId: string, isPacked: boolean) => {
    startTransition(async () => {
      await toggleItemPacked(itemId, !isPacked)
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? { ...item, isPacked: !isPacked } : item
                ),
              }
            : list
        )
      )
    })
  }

  const handleAddItem = async (list: PackingList) => {
    const name = newItemName[list.categoryId]?.trim()
    if (!name) return
    startTransition(async () => {
      const result = await addCustomItem(list.categoryId, name)
      if (result.success && result.item) {
        setLists((prev) =>
          prev.map((l) =>
            l.id === list.id
              ? { ...l, items: [...l.items, result.item as PackingItem] }
              : l
          )
        )
        setNewItemName((prev) => ({ ...prev, [list.categoryId]: '' }))
        setAddingTo(null)
      }
    })
  }

  const handleDelete = (listId: string, itemId: string) => {
    startTransition(async () => {
      await deleteItem(itemId)
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
            : list
        )
      )
    })
  }

  if (!lists || lists.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📝</div>
        <h3 className="font-medium text-gray-700 mb-1">No packing lists yet</h3>
        <p className="text-gray-400 text-sm">Start adding items to pack for your trip.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lists.map((list) => {
        const packed = list.items.filter((i) => i.isPacked).length
        const total = list.items.length
        return (
          <div key={list.id} className="bg-white rounded-2xl border border-gray-100">
            {/* Category header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">{list.categoryName}</h3>
                <span className="text-xs text-gray-400">
                  {packed}/{total}
                </span>
              </div>
              <button
                onClick={() => setAddingTo(addingTo === list.id ? null : list.id)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                + Add item
              </button>
            </div>

            {/* Items */}
            <ul className="divide-y divide-gray-50">
              {list.items
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-6 py-3 group"
                  >
                    <button
                      onClick={() => handleToggle(list.id, item.id, item.isPacked)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.isPacked
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {item.isPacked && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${
                      item.isPacked ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}>
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                      )}
                    </span>
                    {item.isCustom && (
                      <button
                        onClick={() => handleDelete(list.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
            </ul>

            {/* Add item form */}
            {addingTo === list.id && (
              <div className="px-6 py-3 border-t border-gray-50 flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newItemName[list.categoryId] || ''}
                  onChange={(e) =>
                    setNewItemName((prev) => ({ ...prev, [list.categoryId]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem(list)
                    if (e.key === 'Escape') setAddingTo(null)
                  }}
                  placeholder="Item name..."
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddItem(list)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingTo(null)}
                  className="text-gray-400 text-sm hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
