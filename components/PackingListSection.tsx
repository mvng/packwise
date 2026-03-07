'use client'

import { useState, useTransition, useEffect } from 'react'
import { toggleItemPacked, addCustomItem, deleteItem } from '@/actions/packing.actions'
import { getTripLuggage, assignItemToLuggage, removeLuggageFromTrip } from '@/actions/luggage.actions'
import InventoryPickerModal from '@/components/inventory/InventoryPickerModal'
import LuggagePickerModal from '@/components/LuggagePickerModal'
import type { TripLuggage, LuggageType } from '@/types/luggage'

interface PackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  order: number
  tripLuggageId?: string | null
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
  const [showLuggagePicker, setShowLuggagePicker] = useState(false)
  const [inventoryToast, setInventoryToast] = useState<string | null>(null)
  const [tripLuggages, setTripLuggages] = useState<TripLuggage[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'not-assigned': true })
  const [viewMode, setViewMode] = useState<'category' | 'luggage'>('luggage')
  const [draggedItem, setDraggedItem] = useState<{ id: string; categoryId: string; packingListId: string } | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const luggageIcons: Record<LuggageType, string> = {
    backpack: '🎒',
    'carry-on': '🧳',
    checked: '💼',
    trunk: '📦',
    other: '👜',
  }

  useEffect(() => {
    loadTripLuggage()
  }, [])

  async function loadTripLuggage() {
    const result = await getTripLuggage(trip.id)
    if (result.tripLuggages) {
      const luggages = result.tripLuggages as TripLuggage[]
      setTripLuggages(luggages)
      const expanded: Record<string, boolean> = { 'not-assigned': true }
      luggages.forEach(tl => {
        expanded[tl.id] = true
      })
      setExpandedGroups(expanded)
      
      // Set default view mode based on luggage availability
      if (luggages.length === 0) {
        setViewMode('category')
      }
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

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

  const handleAssignLuggage = async (itemId: string, tripLuggageId: string | null, categoryId: string, packingListId: string) => {
    await assignItemToLuggage(itemId, tripLuggageId, trip.id)
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
                        item.id === itemId ? { ...item, tripLuggageId: tripLuggageId || undefined } : item
                      ),
                    }
                  : cat
              ),
            }
          : list
      )
    )
  }

  const handleRemoveLuggage = async (tripLuggageId: string, luggageId: string) => {
    if (!confirm('Remove this luggage from the trip? Items will be unassigned.')) return
    
    await removeLuggageFromTrip(trip.id, luggageId)
    setTripLuggages(prev => prev.filter(tl => tl.id !== tripLuggageId))
    
    // Unassign all items from this luggage
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        categories: list.categories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.tripLuggageId === tripLuggageId
              ? { ...item, tripLuggageId: undefined }
              : item
          ),
        })),
      }))
    )
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string, categoryId: string, packingListId: string) => {
    setDraggedItem({ id: itemId, categoryId, packingListId })
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5'
      }
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverTarget(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, targetLuggageId?: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(targetLuggageId === undefined ? null : (targetLuggageId || 'not-assigned'))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverTarget(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetLuggageId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem) return

    handleAssignLuggage(draggedItem.id, targetLuggageId, draggedItem.categoryId, draggedItem.packingListId)
    setDraggedItem(null)
    setDragOverTarget(null)
  }

  function handleInventorySuccess(count: number) {
    setInventoryToast(`${count} item${count !== 1 ? 's' : ''} added to your packing list`)
    setTimeout(() => setInventoryToast(null), 3500)
    window.location.reload()
  }

  function handleLuggageSuccess() {
    loadTripLuggage()
    setShowLuggagePicker(false)
  }

  function getLuggageIcon(tl: TripLuggage) {
    return tl.luggage.icon || luggageIcons[tl.luggage.type as LuggageType]
  }

  const allItems = lists.flatMap(list => 
    list.categories.flatMap(cat => 
      cat.items.map(item => ({
        ...item,
        categoryId: cat.id,
        categoryName: cat.name,
        packingListId: list.id
      }))
    )
  )

  const itemsByLuggage: Record<string, typeof allItems> = {
    'not-assigned': allItems.filter(item => !item.tripLuggageId)
  }

  tripLuggages.forEach(tl => {
    itemsByLuggage[tl.id] = allItems.filter(item => item.tripLuggageId === tl.id)
  })

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

  const renderItem = (item: typeof allItems[0]) => (
    <div
      key={item.id}
      draggable={tripLuggages.length > 0}
      onDragStart={(e) => handleDragStart(e, item.id, item.categoryId, item.packingListId)}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 group transition-opacity ${
        tripLuggages.length > 0 ? 'cursor-move' : ''
      }`}
    >
      <button
        onClick={() => handleToggle(item.id, item.categoryId, item.packingListId, item.isPacked)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-all ${
          item.isPacked
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {item.isPacked && (
          <svg className="w-3 h-3 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm ${ item.isPacked ? 'line-through text-gray-400' : 'text-gray-700' }`}>
        {item.quantity > 1 && <span className="font-medium mr-1">{item.quantity}x</span>}
        {item.name}
        {viewMode === 'luggage' && <span className="text-xs text-gray-400 ml-2">• {item.categoryName}</span>}
      </span>
      <button
        onClick={() => handleDelete(item.id, item.categoryId, item.packingListId)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
        aria-label={`Remove ${item.name}`}
      >
        ×
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {addError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {addError}
        </div>
      )}

      {inventoryToast && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>✓ {inventoryToast}</span>
          <button onClick={() => setInventoryToast(null)} className="text-green-400 hover:text-green-600 ml-2">×</button>
        </div>
      )}

      <button
        onClick={() => setShowInventoryPicker(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors"
      >
        🎒 Add from Inventory
      </button>

      {/* Bags in Use Header */}
      <div
        onDragOver={(e) => tripLuggages.length > 0 && handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => e.preventDefault()}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Bags for this trip</h3>
          {tripLuggages.length > 0 && (
            <span className="text-xs text-gray-500">{tripLuggages.length} bag{tripLuggages.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tripLuggages.map((tl) => {
            const itemCount = itemsByLuggage[tl.id]?.length || 0
            const isDropTarget = dragOverTarget === tl.id
            return (
              <div
                key={tl.id}
                onDragOver={(e) => {
                  e.stopPropagation()
                  handleDragOver(e, tl.id)
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.stopPropagation()
                  handleDrop(e, tl.id)
                }}
                className={`group relative flex items-center gap-2 px-3 py-2 bg-white border rounded-xl hover:shadow-sm transition-all ${
                  isDropTarget
                    ? 'border-blue-500 border-2 bg-blue-50 shadow-md scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-lg">{getLuggageIcon(tl)}</span>
                <span className="text-sm font-medium text-gray-700">{tl.luggage.name}</span>
                {itemCount > 0 && (
                  <span className="text-xs text-gray-500">({itemCount})</span>
                )}
                <button
                  onClick={() => handleRemoveLuggage(tl.id, tl.luggageId)}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  aria-label={`Remove ${tl.luggage.name}`}
                >
                  ×
                </button>
              </div>
            )
          })}
          
          <button
            onClick={() => setShowLuggagePicker(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-dashed border-blue-300 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            + Add bag
          </button>
        </div>
        
        {tripLuggages.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">Add luggage to organize your items by bag</p>
        ) : (
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <span>💡</span>
            <span>Drag items to assign them to bags</span>
          </p>
        )}
      </div>

      {tripLuggages.length > 0 && (
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('luggage')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'luggage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Luggage
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'category'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Category
          </button>
        </div>
      )}

      {viewMode === 'luggage' && tripLuggages.length > 0 ? (
        <div className="space-y-4">
          {tripLuggages.map((tl) => {
            const items = itemsByLuggage[tl.id] || []
            const packedCount = items.filter(i => i.isPacked).length
            const isExpanded = expandedGroups[tl.id]
            const isDropTarget = dragOverTarget === tl.id

            return (
              <div
                key={tl.id}
                onDragOver={(e) => handleDragOver(e, tl.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tl.id)}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  isDropTarget
                    ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]'
                    : 'border-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleGroup(tl.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getLuggageIcon(tl)}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{tl.luggage.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {tl.luggage.type}
                        {tl.luggage.capacity && ` • ${tl.luggage.capacity}L`}
                        {' • '}
                        {packedCount}/{items.length} items packed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {items.length > 0 && (
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(packedCount / items.length) * 100}%` }}
                        />
                      </div>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-50">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No items assigned • Drag items here</p>
                    ) : (
                      <div className="space-y-2 pt-4">
                        {items.map(item => renderItem(item))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {itemsByLuggage['not-assigned'].length > 0 && (
            <div
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                dragOverTarget === 'not-assigned'
                  ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]'
                  : 'border-gray-100'
              }`}
            >
              <button
                onClick={() => toggleGroup('not-assigned')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☐</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Not Assigned</h3>
                    <p className="text-xs text-gray-500">{itemsByLuggage['not-assigned'].length} items</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedGroups['not-assigned'] ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedGroups['not-assigned'] && (
                <div className="px-6 pb-4 border-t border-gray-50">
                  <div className="space-y-2 pt-4">
                    {itemsByLuggage['not-assigned'].map(item => renderItem(item))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        lists.map((list) => (
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
                      <div
                        key={item.id}
                        draggable={tripLuggages.length > 0}
                        onDragStart={(e) => handleDragStart(e, item.id, category.id, list.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 group transition-opacity ${
                          tripLuggages.length > 0 ? 'cursor-move' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleToggle(item.id, category.id, list.id, item.isPacked)}
                          className={`w-5 h-5 rounded border-2 flex-shrink-0 transition-all ${
                            item.isPacked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {item.isPacked && (
                            <svg className="w-3 h-3 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${ item.isPacked ? 'line-through text-gray-400' : 'text-gray-700' }`}>
                          {item.quantity > 1 && <span className="font-medium mr-1">{item.quantity}x</span>}
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
                        onChange={(e) => setNewItemName((prev) => ({ ...prev, [category.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id, list.id)}
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
                        onClick={() => { setAddingTo(null); setAddError(null) }}
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
        ))
      )}

      {showInventoryPicker && (
        <InventoryPickerModal
          tripId={trip.id}
          onClose={() => setShowInventoryPicker(false)}
          onSuccess={handleInventorySuccess}
        />
      )}

      {showLuggagePicker && (
        <LuggagePickerModal
          tripId={trip.id}
          onClose={() => setShowLuggagePicker(false)}
          onSuccess={handleLuggageSuccess}
        />
      )}
    </div>
  )
}
