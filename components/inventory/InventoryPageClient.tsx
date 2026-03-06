'use client'

import { useState, useTransition } from 'react'
import {
  createInventoryCategory,
  updateInventoryCategory,
  deleteInventoryCategory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  toggleInventoryItemFavorite,
} from '@/actions/inventory.actions'

interface InventoryItem {
  id: string
  categoryId: string
  name: string
  quantity: number
  notes: string | null
  isFavorite: boolean
  order: number
}

interface InventoryCategory {
  id: string
  name: string
  order: number
  items: InventoryItem[]
}

interface Props {
  initialCategories: InventoryCategory[]
}

export default function InventoryPageClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<InventoryCategory[]>(initialCategories)
  const [search, setSearch] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [newItemData, setNewItemData] = useState({ name: '', quantity: 1, notes: '' })
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemData, setEditItemData] = useState({ name: '', quantity: 1, notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => search === '' || cat.items.length > 0)

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0)

  // ── Category handlers ─────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    setError(null)
    const result = await createInventoryCategory(name)
    if (result.error) { setError(result.error); return }
    if (result.category) setCategories((prev) => [...prev, result.category!])
    setNewCategoryName('')
    setAddingCategory(false)
  }

  const handleUpdateCategory = async (categoryId: string) => {
    const name = editCategoryName.trim()
    if (!name) return
    setError(null)
    const result = await updateInventoryCategory(categoryId, name)
    if (result.error) { setError(result.error); return }
    setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, name } : c))
    setEditingCategoryId(null)
  }

  const handleDeleteCategory = (categoryId: string) => {
    startTransition(async () => {
      setError(null)
      const result = await deleteInventoryCategory(categoryId)
      if (result.error) { setError(result.error); return }
      setCategories((prev) => prev.filter((c) => c.id !== categoryId))
    })
  }

  // ── Item handlers ─────────────────────────────────────────────────────────

  const handleAddItem = async (categoryId: string) => {
    const name = newItemData.name.trim()
    if (!name) return
    setError(null)
    const result = await createInventoryItem(categoryId, {
      name,
      quantity: newItemData.quantity,
      notes: newItemData.notes,
    })
    if (result.error) { setError(result.error); return }
    if (result.item) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, items: [...c.items, result.item!] } : c
        )
      )
    }
    setNewItemData({ name: '', quantity: 1, notes: '' })
    setAddingItemTo(null)
  }

  const handleUpdateItem = async (itemId: string, categoryId: string) => {
    const name = editItemData.name.trim()
    if (!name) return
    setError(null)
    const result = await updateInventoryItem(itemId, {
      name,
      quantity: editItemData.quantity,
      notes: editItemData.notes,
    })
    if (result.error) { setError(result.error); return }
    if (result.item) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === itemId
                    ? { ...i, name: result.item!.name, quantity: result.item!.quantity, notes: result.item!.notes }
                    : i
                ),
              }
            : c
        )
      )
    }
    setEditingItemId(null)
  }

  const handleDeleteItem = (itemId: string, categoryId: string) => {
    startTransition(async () => {
      setError(null)
      const result = await deleteInventoryItem(itemId)
      if (result.error) { setError(result.error); return }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        )
      )
    })
  }

  const handleToggleFavorite = (itemId: string, categoryId: string, current: boolean) => {
    startTransition(async () => {
      await toggleInventoryItemFavorite(itemId, !current)
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, isFavorite: !current } : i) }
            : c
        )
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          onClick={() => setAddingCategory(true)}
          className="text-sm px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium whitespace-nowrap"
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Inline add-category form */}
      {addingCategory && (
        <div className="bg-white rounded-2xl border border-blue-200 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddCategory}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => { setAddingCategory(false); setNewCategoryName('') }}
            className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty state – no items at all */}
      {totalItems === 0 && search === '' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🎒</div>
          <h3 className="font-semibold text-gray-900 mb-2">Your inventory is empty</h3>
          <p className="text-gray-500 text-sm">
            Add your gear to any category above — then reuse items across all your trips.
          </p>
        </div>
      )}

      {/* Empty state – search returned nothing */}
      {search !== '' && filteredCategories.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-sm">No items match &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Category cards */}
      {filteredCategories.map((category) => (
        <div key={category.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Category header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            {editingCategoryId === category.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(category.id)}
                  className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateCategory(category.id)}
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingCategoryId(null)}
                  className="text-sm px-2 py-1.5 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {category.name}
                  <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
                    ({category.items.length})
                  </span>
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingCategoryId(category.id); setEditCategoryName(category.name) }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Items list */}
          <div className="divide-y divide-gray-50 px-6">
            {category.items.map((item) => (
              <div key={item.id} className="py-3">
                {editingItemId === item.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editItemData.name}
                      onChange={(e) => setEditItemData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Item name"
                      className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editItemData.quantity}
                        min={1}
                        onChange={(e) =>
                          setEditItemData((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))
                        }
                        className="w-20 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={editItemData.notes}
                        onChange={(e) => setEditItemData((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Notes (optional)"
                        className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateItem(item.id, category.id)}
                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <button
                      onClick={() => handleToggleFavorite(item.id, category.id, item.isFavorite)}
                      className={`text-base flex-shrink-0 transition-opacity ${
                        item.isFavorite ? 'opacity-100' : 'opacity-20 group-hover:opacity-50'
                      }`}
                      aria-label={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      ⭐
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800">{item.name}</span>
                      {item.notes && (
                        <span className="ml-2 text-xs text-gray-400 truncate">{item.notes}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      ×{item.quantity}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingItemId(item.id)
                          setEditItemData({
                            name: item.name,
                            quantity: item.quantity,
                            notes: item.notes ?? '',
                          })
                        }}
                        className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, category.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded"
                        aria-label={`Delete ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add item row */}
            {addingItemTo === category.id ? (
              <div className="py-3 space-y-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id)}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newItemData.quantity}
                    min={1}
                    onChange={(e) =>
                      setNewItemData((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))
                    }
                    placeholder="Qty"
                    className="w-20 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newItemData.notes}
                    onChange={(e) => setNewItemData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddItem(category.id)}
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingItemTo(null)
                      setNewItemData({ name: '', quantity: 1, notes: '' })
                    }}
                    className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-3">
                <button
                  onClick={() => setAddingItemTo(category.id)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  + Add item
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
