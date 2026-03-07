'use client'

import { useState } from 'react'
import type { InventoryCategoryData, InventoryItemData } from '@/types/inventory'

interface CategorySectionProps {
  category: InventoryCategoryData
  onAddItem: () => void
  onDeleteCategory: () => void
  onEditItem: (item: InventoryItemData) => void
  onDeleteItem: (itemId: string) => void
  onToggleFavorite: (item: InventoryItemData) => void
  isPending: boolean
}

export default function CategorySection({
  category,
  onAddItem,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  onToggleFavorite,
  isPending,
}: CategorySectionProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Category header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {category.items.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddItem}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            + Add item
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="text-gray-400 hover:text-gray-600 px-1 transition-colors text-lg leading-none"
              aria-label="Category options"
            >
              •••
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[148px] overflow-hidden">
                  <button
                    onClick={() => {
                      onDeleteCategory()
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete category
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      {category.items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-400">No items yet.</p>
          <button
            onClick={onAddItem}
            className="mt-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {category.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3 group">
              {/* Favorite toggle */}
              <button
                onClick={() => onToggleFavorite(item)}
                disabled={isPending}
                title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className="text-base leading-none flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
              >
                {item.isFavorite ? (
                  '⭐'
                ) : (
                  <span className="text-gray-300 hover:text-yellow-400">☆</span>
                )}
              </button>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">
                      ×{item.quantity}
                    </span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{item.notes}</p>
                )}
              </div>

              {/* Actions (visible on hover) */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditItem(item)}
                  title="Edit item"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  disabled={isPending}
                  title="Delete item"
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
