'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getInventory,
  initializeInventory,
  deleteInventoryItem,
  updateInventoryItem,
} from '@/actions/inventory.actions'
import { InventoryCategory, InventoryItem } from '@/types'
import AddInventoryItemModal from '@/components/AddInventoryItemModal'

export default function InventoryPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    const initResult = await initializeInventory()
    if (initResult.error) {
      alert(initResult.error)
      return
    }

    const result = await getInventory()
    if (result.error) {
      alert(result.error)
    } else if (result.categories) {
      setCategories(result.categories as any)
      // Auto-expand categories with items
      const expanded = new Set(
        result.categories.filter(c => c.items && c.items.length > 0).map(c => c.id)
      )
      setExpandedCategories(expanded)
    }
    setLoading(false)
  }

  const handleDelete = async (itemId: string) {
    if (!confirm('Delete this item from your gear closet?')) return
    const result = await deleteInventoryItem(itemId)
    if (result.error) {
      alert(result.error)
    } else {
      loadInventory()
    }
  }

  const handleToggleFavorite = async (item: InventoryItem) => {
    const result = await updateInventoryItem(item.id, {
      isFavorite: !item.isFavorite,
    })
    if (result.error) {
      alert(result.error)
    } else {
      loadInventory()
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      categories.flatMap(cat =>
        cat.items?.flatMap(item => item.tags) ?? []
      )
    )
  ).sort()

  // Filter items
  const filteredCategories = categories.map(category => {
    const items = category.items?.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag = !filterTag || item.tags.includes(filterTag)
      const matchesFavorite = !showFavoritesOnly || item.isFavorite
      return matchesSearch && matchesTag && matchesFavorite
    }) ?? []
    return { ...category, items }
  }).filter(cat => cat.items.length > 0)

  const totalItems = categories.reduce((sum, cat) => sum + (cat.items?.length ?? 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-gray-500">Loading your gear closet...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ←
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                🧳 My Gear Closet
              </h1>
              {totalItems > 0 && (
                <span className="text-sm text-gray-500">({totalItems} items)</span>
              )}
            </div>
            <button
              onClick={() => {
                setEditingItem(null)
                setShowAddModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Add Item
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {allTags.length > 0 && (
              <select
                value={filterTag ?? ''}
                onChange={(e) => setFilterTag(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ★ {showFavoritesOnly ? 'Favorites only' : 'All items'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🧳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your gear closet is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add items you own to quickly build packing lists for future trips
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add your first item
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No items match your filters
            </h2>
            <p className="text-gray-600">
              Try adjusting your search or filter settings
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map(category => (
              <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <h2 className="text-lg font-bold text-gray-900">
                      {category.name}
                    </h2>
                    <span className="text-sm text-gray-500">
                      ({category.items?.length ?? 0} items)
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {expandedCategories.has(category.id) ? '▼' : '▶'}
                  </span>
                </button>

                {/* Items List */}
                {expandedCategories.has(category.id) && (
                  <div className="border-t border-gray-200">
                    {category.items?.map(item => (
                      <div
                        key={item.id}
                        className="px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => handleToggleFavorite(item)}
                                className="text-xl hover:scale-110 transition-transform"
                              >
                                {item.isFavorite ? '⭐' : '☆'}
                              </button>
                              <h3 className="font-semibold text-gray-900">
                                {item.name}
                              </h3>
                              {item.quantity > 1 && (
                                <span className="text-sm text-gray-500">
                                  ×{item.quantity}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                              {item.brand && <span>🏷️ {item.brand}</span>}
                              {item.size && <span>📏 {item.size}</span>}
                            </div>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                            )}
                            {item.timesUsed > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Packed {item.timesUsed} {item.timesUsed === 1 ? 'time' : 'times'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingItem(item)
                                setShowAddModal(true)
                              }}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddInventoryItemModal
          categories={categories}
          editingItem={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingItem(null)
            loadInventory()
          }}
        />
      )}
    </div>
  )
}
