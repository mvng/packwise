'use client'

import { useState, useTransition, useMemo, useOptimistic } from 'react'
import {
  createInventoryCategory,
  deleteInventoryCategory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/actions/inventory.actions'
import type { InventoryCategoryData, InventoryItemData, ItemFormData } from '@/types/inventory'
import CategorySection from './CategorySection'
import AddCategoryModal from './AddCategoryModal'
import AddItemModal from './AddItemModal'

interface InventoryClientProps {
  initialCategories: InventoryCategoryData[]
}

export default function InventoryClient({ initialCategories }: InventoryClientProps) {
  const [categories, setCategories] = useState<InventoryCategoryData[]>(initialCategories)
  const [search, setSearch] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [addItemCategoryId, setAddItemCategoryId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<InventoryItemData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [optimisticCategories, addOptimisticCategoryUpdate] = useOptimistic(
    categories,
    (state, action: { type: string, payload: any }) => {
      switch (action.type) {
        case 'ADD_CATEGORY':
          return [...state, action.payload.category]
        case 'DELETE_CATEGORY':
          return state.filter(c => c.id !== action.payload.categoryId)
        case 'ADD_ITEM':
          return state.map(cat => cat.id === action.payload.categoryId ? {
            ...cat,
            items: [...cat.items, action.payload.item]
          } : cat)
        case 'SAVE_ITEM':
          return state.map(cat => ({
            ...cat,
            items: cat.items.map((item: any) => item.id === action.payload.itemId ? { ...item, ...action.payload.data } : item)
          }))
        case 'DELETE_ITEM':
          return state.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.id !== action.payload.itemId)
          }))
        default:
          return state
      }
    }
  )

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return optimisticCategories
    const q = search.toLowerCase()
    return optimisticCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item: any) => item.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0 || cat.name.toLowerCase().includes(q))
  }, [categories, search])

  const totalItems = optimisticCategories.reduce((sum, cat) => sum + cat.items.length, 0)

  function handleAddCategory(name: string) {
    setError(null)
    const tempId = crypto.randomUUID()
    const optimisticCategory: InventoryCategoryData = {
      id: tempId,
      name,
      order: optimisticCategories.length,
      items: [],
      userId: 'temp-user-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    startTransition(async () => {
      addOptimisticCategoryUpdate({
        type: 'ADD_CATEGORY',
        payload: { category: optimisticCategory }
      })
      setShowAddCategory(false)

      const result = await createInventoryCategory(name)

      if ('error' in result) {
        setError(result.error)
        setShowAddCategory(true) // Re-open on error
      } else {
        setCategories((prev) => [
          ...prev,
          { ...result.category, items: [] } as InventoryCategoryData,
        ])
      }
    })
  }

  function handleDeleteCategory(categoryId: string) {
    setError(null)
    startTransition(async () => {
      addOptimisticCategoryUpdate({
        type: 'DELETE_CATEGORY',
        payload: { categoryId }
      })

      const result = await deleteInventoryCategory(categoryId)

      if ('error' in result) {
        setError(result.error)
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId))
      }
    })
  }

  function handleAddItem(categoryId: string, data: ItemFormData) {
    setError(null)
    const tempId = crypto.randomUUID()
    const optimisticItem: InventoryItemData = {
      id: tempId,
      categoryId,
      name: data.name,
      quantity: data.quantity,
      notes: data.notes || null,
      isFavorite: false,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    startTransition(async () => {
      addOptimisticCategoryUpdate({
        type: 'ADD_ITEM',
        payload: { categoryId, item: optimisticItem }
      })
      setAddItemCategoryId(null)

      const result = await createInventoryItem({ categoryId, ...data })

      if ('error' in result) {
        setError(result.error)
        setAddItemCategoryId(categoryId) // Re-open on error
      } else {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId
              ? { ...cat, items: [...cat.items, result.item as InventoryItemData] }
              : cat
          )
        )
      }
    })
  }

  function handleSaveItem(
    itemId: string,
    data: Partial<ItemFormData> & { isFavorite?: boolean }
  ) {
    setError(null)
    startTransition(async () => {
      // Find the old item so we can re-open edit on failure
      const oldItem = categories.flatMap(c => c.items).find(i => i.id === itemId)

      addOptimisticCategoryUpdate({
        type: 'SAVE_ITEM',
        payload: { itemId, data }
      })
      setEditItem(null)

      const result = await updateInventoryItem(itemId, data)

      if ('error' in result) {
        setError(result.error)
        if (oldItem) setEditItem(oldItem)
      } else {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((item) =>
              item.id === itemId ? { ...item, ...data } : item
            ),
          }))
        )
      }
    })
  }

  function handleDeleteItem(itemId: string) {
    setError(null)
    startTransition(async () => {
      addOptimisticCategoryUpdate({
        type: 'DELETE_ITEM',
        payload: { itemId }
      })

      const result = await deleteInventoryItem(itemId)

      if ('error' in result) {
        setError(result.error)
      } else {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => item.id !== itemId),
          }))
        )
      }
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
        >
          + Category
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Empty state */}
      {optimisticCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🎒</div>
          <h3 className="font-semibold text-gray-900 mb-2">No inventory yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Create categories to organize your gear, then add items you own and reuse them
            across any trip.
          </p>
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            Create your first category
          </button>
        </div>
      ) : filteredCategories.length === 0 && search ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-gray-500">No items match &ldquo;{search}&rdquo;</p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAddItem={() => setAddItemCategoryId(category.id)}
              onDeleteCategory={() => handleDeleteCategory(category.id)}
              onEditItem={setEditItem}
              onDeleteItem={handleDeleteItem}
              onToggleFavorite={(item) =>
                handleSaveItem(item.id, { isFavorite: !item.isFavorite })
              }
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Footer count */}
      {totalItems > 0 && !search && (
        <p className="text-xs text-gray-500 text-center mt-6">
          {totalItems} item{totalItems !== 1 ? 's' : ''} across {optimisticCategories.length} categor
          {optimisticCategories.length !== 1 ? 'ies' : 'y'}
        </p>
      )}

      {/* Modals */}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSubmit={handleAddCategory}
          isPending={isPending}
        />
      )}

      {addItemCategoryId && (
        <AddItemModal
          mode="add"
          onClose={() => setAddItemCategoryId(null)}
          onSubmit={(data) => handleAddItem(addItemCategoryId, data)}
          isPending={isPending}
        />
      )}

      {editItem && (
        <AddItemModal
          mode="edit"
          initialValues={{
            name: editItem.name,
            quantity: editItem.quantity,
            notes: editItem.notes ?? '',
          }}
          onClose={() => setEditItem(null)}
          onSubmit={(data) => handleSaveItem(editItem.id, data)}
          isPending={isPending}
        />
      )}
    </div>
  )
}
