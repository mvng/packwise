'use client'

import { useState, useTransition, useEffect, useCallback, useOptimistic } from 'react'
import { toggleItemPacked, addCustomItem, deleteItem, togglePackLast, updateItemNotes, assignItemToMember, generateShareToken } from '@/actions/packing.actions'
import { getTripLuggage, assignItemToLuggage, removeLuggageFromTrip } from '@/actions/luggage.actions'
import InventoryPickerModal from '@/components/inventory/InventoryPickerModal'
import LuggagePickerModal from '@/components/LuggagePickerModal'
import PasteListModal from '@/components/PasteListModal'
import type { TripLuggage, LuggageType } from '@/types/luggage'
import { Backpack, X, Plus, Sunrise, MessageSquare, User, Check, Share2, Copy } from 'lucide-react'

export interface TripMember {
  id: string
  tripId: string
  name: string
  userId?: string | null
}

export interface PackingItem {
  id: string
  name: string
  quantity: number
  isPacked: boolean
  isCustom: boolean
  packLast: boolean
  order: number
  notes?: string | null
  assigneeId?: string | null
  assignee?: TripMember | null
  tripLuggageId?: string | null
  guestClaimant?: string | null
  tripLuggage?: {
    id: string
    luggage: {
      id: string
      name: string
      type: string
      icon?: string
    }
  }
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
  shareToken?: string | null
  categories: Category[]
}

export interface Trip {
  id: string
  packingLists: PackingList[]
  members?: TripMember[]
}

interface PackingListSectionProps {
  trip: Trip
  readOnly?: boolean
  sharedTripLuggages?: TripLuggage[]
}

const STORAGE_KEY_PREFIX = 'packwise_trip_'

export default function PackingListSection({ trip, readOnly = false, sharedTripLuggages }: PackingListSectionProps) {
  const [lists, setLists] = useState(trip.packingLists)
  const [newItemName, setNewItemName] = useState<Record<string, string>>({})
  const [newItemAssignee, setNewItemAssignee] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ id: string, notes: string } | null>(null)
  const [assigningItem, setAssigningItem] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [showInventoryPicker, setShowInventoryPicker] = useState(false)
  const [showPasteList, setShowPasteList] = useState(false)
  const [showLuggagePicker, setShowLuggagePicker] = useState(false)
  const [inventoryToast, setInventoryToast] = useState<string | null>(null)
  const [tripLuggages, setTripLuggages] = useState<TripLuggage[]>(sharedTripLuggages || [])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'not-assigned': true, 'pack-last': true })
  const [viewMode, setViewMode] = useState<'category' | 'luggage' | 'person'>('category')
  const [draggedItem, setDraggedItem] = useState<{ id: string; categoryId: string; packingListId: string } | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [localPackedState, setLocalPackedState] = useState<Record<string, boolean>>({})
  const [isBagsCardExpanded, setIsBagsCardExpanded] = useState(true)
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const [optimisticLists, addOptimisticListUpdate] = useOptimistic(
    lists,
    (state, action: { type: string, payload: any }) => {
      switch (action.type) {
        case 'TOGGLE_PACKED':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.map(item => item.id === action.payload.itemId ? { ...item, isPacked: action.payload.isPacked } : item)
            } : cat)
          } : list)
        case 'TOGGLE_PACK_LAST':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.map(item => item.id === action.payload.itemId ? { ...item, packLast: action.payload.packLast } : item)
            } : cat)
          } : list)
        case 'ADD_ITEM':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: [...cat.items, action.payload.item]
            } : cat)
          } : list)
        case 'DELETE_ITEM':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.filter(item => item.id !== action.payload.itemId)
            } : cat)
          } : list)
        case 'ASSIGN_LUGGAGE':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.map(item => item.id === action.payload.itemId ? { ...item, tripLuggageId: action.payload.tripLuggageId || undefined } : item)
            } : cat)
          } : list)
        case 'UPDATE_NOTES':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.map(item => item.id === action.payload.itemId ? { ...item, notes: action.payload.notes } : item)
            } : cat)
          } : list)
        case 'ASSIGN_MEMBER':
          return state.map(list => list.id === action.payload.packingListId ? {
            ...list,
            categories: list.categories.map(cat => cat.id === action.payload.categoryId ? {
              ...cat,
              items: cat.items.map(item => item.id === action.payload.itemId ? { ...item, assigneeId: action.payload.assigneeId, assignee: action.payload.assignee } : item)
            } : cat)
          } : list)
        case 'REMOVE_LUGGAGE':
          return state.map(list => ({
            ...list,
            categories: list.categories.map(cat => ({
              ...cat,
              items: cat.items.map(item => item.tripLuggageId === action.payload.tripLuggageId ? { ...item, tripLuggageId: undefined } : item)
            }))
          }))
        default:
          return state
      }
    }
  )

  const [optimisticTripLuggages, addOptimisticTripLuggagesUpdate] = useOptimistic(
    tripLuggages,
    (state, action: { type: string, payload: any }) => {
      switch (action.type) {
        case 'REMOVE_LUGGAGE':
          return state.filter(tl => tl.id !== action.payload.tripLuggageId)
        default:
          return state
      }
    }
  )

  const luggageIcons: Record<LuggageType, string> = {
    backpack: '🎒',
    'carry-on': '🧳',
    checked: '💼',
    trunk: '📦',
    other: '👜',
  }

  useEffect(() => {
    if (readOnly && typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${trip.id}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setLocalPackedState(parsed.packedItems || {})
        } catch (e) {
          console.error('Failed to parse localStorage state:', e)
        }
      }
    }
  }, [readOnly, trip.id])

  useEffect(() => {
    if (readOnly && typeof window !== 'undefined' && Object.keys(localPackedState).length > 0) {
      const storageKey = `${STORAGE_KEY_PREFIX}${trip.id}`
      localStorage.setItem(storageKey, JSON.stringify({ packedItems: localPackedState }))
    }
  }, [localPackedState, readOnly, trip.id])

  const loadTripLuggage = useCallback(async () => {
    const result = await getTripLuggage(trip.id)
    if (result.tripLuggages) {
      const luggages = result.tripLuggages as TripLuggage[]
      setTripLuggages(luggages)
      const expanded: Record<string, boolean> = { 'not-assigned': true, 'pack-last': true }
      luggages.forEach(tl => {
        expanded[tl.id] = true
      })
      setExpandedGroups(expanded)
      if (luggages.length > 0) setViewMode('luggage')
    }
  }, [trip.id])

  useEffect(() => {
    if (!readOnly) {
      loadTripLuggage()
    } else if (sharedTripLuggages && sharedTripLuggages.length > 0) {
      const expanded: Record<string, boolean> = { 'not-assigned': true, 'pack-last': true }
      sharedTripLuggages.forEach(tl => {
        expanded[tl.id] = true
      })
      setExpandedGroups(expanded)
      setViewMode('luggage')
    }
  }, [readOnly, sharedTripLuggages, trip.id, loadTripLuggage])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const handleToggle = (itemId: string, categoryId: string, packingListId: string, isPacked: boolean) => {
    if (readOnly) {
      setLocalPackedState(prev => ({ ...prev, [itemId]: !isPacked }))
      return
    }
    startTransition(async () => {
      addOptimisticListUpdate({
        type: 'TOGGLE_PACKED',
        payload: { itemId, categoryId, packingListId, isPacked: !isPacked }
      })

      const result = await toggleItemPacked(itemId, !isPacked, trip.id)

      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list =>
          list.id === packingListId ? {
            ...list,
            categories: list.categories.map(cat =>
              cat.id === categoryId ? {
                ...cat,
                items: cat.items.map(item =>
                  item.id === itemId ? { ...item, isPacked: !isPacked } : item
                )
              } : cat
            )
          } : list
        ))
      }
    })
  }

  const handleTogglePackLast = (itemId: string, categoryId: string, packingListId: string, current: boolean) => {
    if (readOnly) return
    startTransition(async () => {
      addOptimisticListUpdate({
        type: 'TOGGLE_PACK_LAST',
        payload: { itemId, categoryId, packingListId, packLast: !current }
      })

      const result = await togglePackLast(itemId, !current, trip.id)

      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list =>
          list.id === packingListId ? {
            ...list,
            categories: list.categories.map(cat =>
              cat.id === categoryId ? {
                ...cat,
                items: cat.items.map(item =>
                  item.id === itemId ? { ...item, packLast: !current } : item
                )
              } : cat
            )
          } : list
        ))
      }
    })
  }

  const handleAddItem = (categoryId: string, packingListId: string) => {
    if (readOnly) return
    const name = newItemName[categoryId]?.trim()
    const assigneeId = newItemAssignee[categoryId] || undefined
    if (!name) return
    setAddError(null)

    let displayName = name
    let assigneeInitial = null
    const assigneeMatch = name.match(/@(\w+)/)

    if (assigneeMatch) {
      assigneeInitial = assigneeMatch[1].charAt(0).toUpperCase()
      displayName = name.replace(assigneeMatch[0], '').trim() || assigneeMatch[1]
    }

    const tempId = crypto.randomUUID()
    const optimisticItem: PackingItem = {
      id: tempId,
      name: displayName,
      quantity: 1,
      isPacked: false,
      isCustom: true,
      packLast: false,
      order: 0,
      assigneeId,
      assignee: assigneeId ? (trip.members?.find(m => m.id === assigneeId) || null) : null,
      ...(assigneeInitial ? {
        assignee: {
          id: 'temp-assignee',
          name: assigneeMatch![1],
          tripId: trip.id,
          userId: null,
        }
      } : {})
    }

    startTransition(async () => {
      addOptimisticListUpdate({
        type: 'ADD_ITEM',
        payload: { categoryId, packingListId, item: optimisticItem }
      })
      setNewItemName(prev => ({ ...prev, [categoryId]: '' }))
      setNewItemAssignee(prev => ({ ...prev, [categoryId]: '' }))
      setAddingTo(null)

      const result = await addCustomItem(categoryId, name, 1, trip.id, assigneeId)

      if (result.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else if (result.item) {
        setLists(prev => prev.map(list =>
          list.id === packingListId ? {
            ...list,
            categories: list.categories.map(cat =>
              cat.id === categoryId ? { ...cat, items: [...cat.items, result.item!] } : cat
            )
          } : list
        ))
      }
    })
  }

  const handleDelete = (itemId: string, categoryId: string, packingListId: string) => {
    if (readOnly) return
    startTransition(async () => {
      addOptimisticListUpdate({
        type: 'DELETE_ITEM',
        payload: { itemId, categoryId, packingListId }
      })

      const result = await deleteItem(itemId, trip.id)

      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list =>
          list.id === packingListId ? {
            ...list,
            categories: list.categories.map(cat =>
              cat.id === categoryId ? { ...cat, items: cat.items.filter(item => item.id !== itemId) } : cat
            )
          } : list
        ))
      }
    })
  }

  const handleAssignLuggage = (itemId: string, tripLuggageId: string | null, categoryId: string, packingListId: string) => {
    if (readOnly) return
    startTransition(async () => {
      addOptimisticListUpdate({
        type: 'ASSIGN_LUGGAGE',
        payload: { itemId, tripLuggageId, categoryId, packingListId }
      })

      const result = await assignItemToLuggage(itemId, tripLuggageId, trip.id)

      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list =>
          list.id === packingListId ? {
            ...list,
            categories: list.categories.map(cat =>
              cat.id === categoryId ? {
                ...cat,
                items: cat.items.map(item =>
                  item.id === itemId ? { ...item, tripLuggageId: tripLuggageId || undefined } : item
                )
              } : cat
            )
          } : list
        ))
      }
    })
  }

  const handleRemoveLuggage = (tripLuggageId: string, luggageId: string) => {
    if (readOnly) return
    if (!confirm('Remove this luggage from the trip? Items will be unassigned.')) return

    startTransition(async () => {
      addOptimisticTripLuggagesUpdate({
        type: 'REMOVE_LUGGAGE',
        payload: { tripLuggageId }
      })
      addOptimisticListUpdate({
        type: 'REMOVE_LUGGAGE',
        payload: { tripLuggageId }
      })

      const result = await removeLuggageFromTrip(trip.id, luggageId)

      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setTripLuggages(prev => prev.filter(tl => tl.id !== tripLuggageId))
        setLists(prev => prev.map(list => ({
          ...list,
          categories: list.categories.map(cat => ({
            ...cat,
            items: cat.items.map(item =>
              item.tripLuggageId === tripLuggageId ? { ...item, tripLuggageId: undefined } : item
            )
          }))
        })))
      }
    })
  }

  const handleUpdateNotes = (itemId: string, categoryId: string, packingListId: string, notes: string | null) => {
    if (readOnly) return
    startTransition(async () => {
      addOptimisticListUpdate({ type: 'UPDATE_NOTES', payload: { itemId, categoryId, packingListId, notes } })
      const result = await updateItemNotes(itemId, notes, trip.id)
      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list => list.id === packingListId ? { ...list, categories: list.categories.map(cat => cat.id === categoryId ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, notes } : item) } : cat) } : list))
      }
    })
  }

  const handleAssignMember = (itemId: string, categoryId: string, packingListId: string, assigneeId: string | null, assignee: TripMember | null) => {
    if (readOnly) return
    startTransition(async () => {
      addOptimisticListUpdate({ type: 'ASSIGN_MEMBER', payload: { itemId, categoryId, packingListId, assigneeId, assignee } })
      setAssigningItem(null)
      const result = await assignItemToMember(itemId, assigneeId, trip.id)
      if (result?.error) {
        setAddError(result.error)
        setTimeout(() => setAddError(null), 3000)
      } else {
        setLists(prev => prev.map(list => list.id === packingListId ? { ...list, categories: list.categories.map(cat => cat.id === categoryId ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, assigneeId, assignee } : item) } : cat) } : list))
      }
    })
  }

  const handleDragStart = (e: React.DragEvent, itemId: string, categoryId: string, packingListId: string) => {
    if (readOnly) return
    setDraggedItem({ id: itemId, categoryId, packingListId })
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5' }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverTarget(null)
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, targetLuggageId?: string | null) => {
    if (readOnly) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(targetLuggageId === undefined ? null : (targetLuggageId || 'not-assigned'))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) setDragOverTarget(null)
  }

  const handleDrop = (e: React.DragEvent, targetLuggageId: string | null) => {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem) return
    handleAssignLuggage(draggedItem.id, targetLuggageId, draggedItem.categoryId, draggedItem.packingListId)
    setDraggedItem(null)
    setDragOverTarget(null)
  }

  const handleDragOverPerson = (e: React.DragEvent, targetMemberId?: string | null) => {
    if (readOnly) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(targetMemberId === undefined ? null : (targetMemberId || 'not-assigned-person'))
  }

  const handleDropPerson = (e: React.DragEvent, targetMemberId: string | null) => {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem) return
    const member = targetMemberId ? trip.members?.find(m => m.id === targetMemberId) || null : null
    handleAssignMember(draggedItem.id, draggedItem.categoryId, draggedItem.packingListId, targetMemberId, member)
    setDraggedItem(null)
    setDragOverTarget(null)
  }

  function handleInventorySuccess(count: number) {
    setInventoryToast(`${count} item${count !== 1 ? 's' : ''} added to your packing list`)
    setTimeout(() => setInventoryToast(null), 3500)
    window.location.reload()
  }

  function handlePasteListSuccess(count: number) {
    setInventoryToast(`${count} item${count !== 1 ? 's' : ''} imported to your packing list`)
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

  const getItemPackedState = (item: PackingItem): boolean => {
    if (readOnly) return localPackedState[item.id] ?? item.isPacked
    return item.isPacked
  }

  const handleShareToClaim = async (packingListId: string) => {
    if (readOnly) return
    const result = await generateShareToken(packingListId, trip.id)
    if (result.success && result.token) {
      const url = `${window.location.origin}/claim/${result.token}`
      navigator.clipboard.writeText(url)
      setShareLinkCopied(packingListId)
      setTimeout(() => setShareLinkCopied(null), 3000)
    } else {
      setAddError(result.error || 'Failed to generate link')
      setTimeout(() => setAddError(null), 3000)
    }
  }

  const allItems = optimisticLists.flatMap(list =>
    list.categories.flatMap(cat =>
      cat.items.map(item => ({
        ...item,
        categoryId: cat.id,
        categoryName: cat.name,
        packingListId: list.id,
        isPacked: getItemPackedState(item)
      }))
    )
  )

  const packLastItems = !readOnly ? allItems.filter(item => item.packLast) : []
  const regularItems = allItems.filter(item => !item.packLast)

  const itemsByLuggage: Record<string, typeof allItems> = {
    'not-assigned': regularItems.filter(item => !item.tripLuggageId)
  }
  optimisticTripLuggages.forEach(tl => {
    itemsByLuggage[tl.id] = regularItems.filter(item => item.tripLuggageId === tl.id)
  })

  const itemsByPerson: Record<string, typeof allItems> = {
    'not-assigned': regularItems.filter(item => !item.assigneeId)
  }
  if (trip.members) {
    trip.members.forEach(member => {
      itemsByPerson[member.id] = regularItems.filter(item => item.assigneeId === member.id)
    })
  }

  const renderItem = (item: typeof allItems[0]) => {
    const isPacked = getItemPackedState(item)
    return (
      <div
        key={item.id}
        draggable={!readOnly && tripLuggages.length > 0 && !item.packLast}
        onDragStart={(e) => handleDragStart(e, item.id, item.categoryId, item.packingListId)}
        onDragEnd={handleDragEnd}
        className={`flex items-center gap-3 group transition-opacity ${
          !readOnly && tripLuggages.length > 0 && !item.packLast ? 'cursor-move' : ''
        }`}
        role="listitem"
      >
        <div className="flex-1 flex flex-col gap-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPacked}
              onChange={() => handleToggle(item.id, item.categoryId, item.packingListId, isPacked)}
              className="sr-only peer"
              aria-label={`${item.quantity > 1 ? item.quantity + ' ' : ''}${item.name}${isPacked ? ', packed' : ', not packed'}`}
            />
            <div
              className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${
                isPacked ? 'bg-green-500 border-green-500' : 'border-gray-300'
              } peer-hover:border-blue-400`}
              aria-hidden="true"
            >
              {isPacked && (
                <svg className="w-3 h-3 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${isPacked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.quantity > 1 && <span className="font-medium mr-1">{item.quantity}x</span>}
                  {item.name}
                  {viewMode === 'luggage' && !item.packLast && <span className="text-xs text-gray-400 ml-2">• {item.categoryName}</span>}
                </span>

                {!readOnly && trip.members && trip.members.length > 0 && (
                  <div className="relative inline-block">
                    <button
                      onClick={(e) => { e.preventDefault(); setAssigningItem(assigningItem === item.id ? null : item.id); }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${item.assignee ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {item.assignee ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[8px] font-bold">
                            {item.assignee.name.charAt(0).toUpperCase()}
                          </div>
                          {item.assignee.name}
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" /> Claim
                        </>
                      )}
                    </button>
                    {assigningItem === item.id && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1" onClick={e => e.preventDefault()}>
                        <button
                          onClick={() => handleAssignMember(item.id, item.categoryId, item.packingListId, null, null)}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                          Unassigned
                          {!item.assigneeId && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                        </button>
                        {trip.members.map(member => (
                          <button
                            key={member.id}
                            onClick={() => handleAssignMember(item.id, item.categoryId, item.packingListId, member.id, member)}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            {member.name}
                            {item.assigneeId === member.id && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingNotes?.id === item.id ? (
                <div className="mt-1 flex items-start gap-1" onClick={e => e.preventDefault()}>
                  <textarea
                    autoFocus
                    value={editingNotes?.notes || ""}
                    onChange={(e) => setEditingNotes({ id: item.id, notes: e.target.value })}
                    placeholder="Add notes (e.g. buying there)..."
                    className="text-xs p-1.5 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleUpdateNotes(item.id, item.categoryId, item.packingListId, editingNotes?.notes || "")
                        setEditingNotes(null)
                      } else if (e.key === 'Escape') {
                        setEditingNotes(null)
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        handleUpdateNotes(item.id, item.categoryId, item.packingListId, editingNotes?.notes || "")
                        setEditingNotes(null)
                      }}
                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    ><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingNotes(null)} className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ) : item.notes ? (
                <p
                  onClick={(e) => { e.preventDefault(); if(!readOnly) setEditingNotes({ id: item.id, notes: item.notes || '' }); }}
                  className={`text-xs mt-0.5 text-gray-500 flex items-start gap-1 ${!readOnly ? 'cursor-pointer hover:text-gray-700' : ''}`}
                >
                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {item.notes}
                </p>
              ) : null}

            </div>
          </label>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            <button
              onClick={(e) => { e.preventDefault(); setEditingNotes({ id: item.id, notes: item.notes || '' }) }}
              title="Add/Edit Note"
              aria-label="Add or edit note"
              className="text-xs p-1 rounded-full border bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
            ><MessageSquare className="w-3.5 h-3.5" /></button>
            <button
              onClick={() => handleTogglePackLast(item.id, item.categoryId, item.packingListId, item.packLast)}
              title={item.packLast ? 'Remove from departure checklist' : 'Add to departure checklist (pack last)'}
              className={`text-xs p-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center justify-center ${
                item.packLast
                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
              aria-label={item.packLast ? 'Remove from departure checklist' : 'Add to departure checklist'}
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(item.id, item.categoryId, item.packingListId)}
              className="text-red-400 hover:text-red-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-1"
              aria-label="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!optimisticLists.length) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-900 mb-2">No packing list yet</h3>
          <p className="text-gray-500 text-sm">
            {readOnly ? 'This trip doesn\'t have any items yet.' : 'Create a new trip with auto-generated suggestions to get started.'}
          </p>
        </div>
        {!readOnly && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowInventoryPicker(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Backpack className="w-4 h-4" /> Add from Inventory
              </button>
              <button
                onClick={() => setShowPasteList(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>📋</span> Paste a List
              </button>
            </div>
            {showInventoryPicker && (
              <InventoryPickerModal tripId={trip.id} onClose={() => setShowInventoryPicker(false)} onSuccess={handleInventorySuccess} />
            )}
            {showPasteList && (
              <PasteListModal tripId={trip.id} onClose={() => setShowPasteList(false)} onSuccess={handlePasteListSuccess} />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!readOnly && addError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">{addError}</div>
      )}
      {!readOnly && inventoryToast && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between" role="status" aria-live="polite">
          <span>✓ {inventoryToast}</span>
          <button onClick={() => setInventoryToast(null)} className="text-green-400 hover:text-green-600 ml-2 focus:outline-none focus:ring-2 focus:ring-green-500 rounded" aria-label="Dismiss">×</button>
        </div>
      )}

      {!readOnly && (
        <>
          <div
            onDragOver={(e) => tripLuggages.length > 0 && handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => e.preventDefault()}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 overflow-hidden"
          >
            <button
              onClick={() => setIsBagsCardExpanded(!isBagsCardExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              aria-expanded={isBagsCardExpanded}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-700">Bags for this trip</h3>
                {optimisticTripLuggages.length > 0 && <span className="text-xs text-gray-500">{optimisticTripLuggages.length} bag{optimisticTripLuggages.length !== 1 ? 's' : ''}</span>}
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${isBagsCardExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isBagsCardExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {optimisticTripLuggages.map((tl) => {
                    const itemCount = itemsByLuggage[tl.id]?.length || 0
                    const isDropTarget = dragOverTarget === tl.id
                    return (
                      <div
                        key={tl.id}
                        onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, tl.id) }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, tl.id) }}
                        className={`group relative flex items-center gap-2 px-3 py-2 bg-white border rounded-xl hover:shadow-sm transition-all ${
                          isDropTarget ? 'border-blue-500 border-2 bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-lg">{getLuggageIcon(tl)}</span>
                        <span className="text-sm font-medium text-gray-700">{tl.luggage.name}</span>
                        {itemCount > 0 && <span className="text-xs text-gray-500">({itemCount})</span>}
                        <button
                          onClick={() => handleRemoveLuggage(tl.id, tl.luggageId)}
                          className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 flex items-center"
                          aria-label={`Remove ${tl.luggage.name}`}
                        ><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => setShowLuggagePicker(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-dashed border-blue-300 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ><Plus className="w-4 h-4" /> Add bag</button>
                </div>
                {optimisticTripLuggages.length === 0
                  ? <p className="text-sm text-gray-500">Add luggage to organize your items by bag</p>
                  : <p className="text-xs text-gray-500">💡 Drag items to assign them to bags</p>
                }
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowInventoryPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Backpack className="w-4 h-4" /> Add from Inventory
            </button>
            <button
              onClick={() => setShowPasteList(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-blue-300 rounded-2xl text-sm font-medium text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>📋</span> Paste a List
            </button>
          </div>
        </>
      )}

      {!readOnly && packLastItems.length > 0 && (
        <section className="bg-amber-50 rounded-2xl border border-amber-200 overflow-hidden">
          <button
            onClick={() => toggleGroup('pack-last')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-amber-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
            aria-expanded={expandedGroups['pack-last']}
          >
            <div className="flex items-center gap-3">
              <span className="text-amber-500"><Sunrise className="w-8 h-8" /></span>
              <div className="text-left">
                <h3 className="font-semibold text-amber-900">Morning of Departure</h3>
                <p className="text-xs text-amber-700">
                  {packLastItems.filter(i => getItemPackedState(i)).length}/{packLastItems.length} packed · These go in last
                </p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-amber-400 transition-transform ${expandedGroups['pack-last'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {expandedGroups['pack-last'] && (
            <div className="px-6 pb-4 border-t border-amber-100">
              <p className="text-xs text-amber-600 mt-3 mb-3 flex items-center gap-1">Pack these right before you leave — hover an item and click <Sunrise className="w-3.5 h-3.5 inline" /> to remove it from this list</p>
              <ul className="space-y-2" role="list">
                {packLastItems.map(item => renderItem(item))}
              </ul>
            </div>
          )}
        </section>
      )}

      {(optimisticTripLuggages.length > 0 || (trip.members && trip.members.length > 0)) && (
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
            <button onClick={() => setViewMode('category')} disabled={readOnly} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${ viewMode === 'category' ? 'bg-white text-gray-900 shadow-sm' : readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900' }`}>By Category</button>
            {optimisticTripLuggages.length > 0 && (
              <button onClick={() => setViewMode('luggage')} disabled={readOnly} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${ viewMode === 'luggage' ? 'bg-white text-gray-900 shadow-sm' : readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900' }`}>By Luggage</button>
            )}
            {trip.members && trip.members.length > 0 && (
              <button onClick={() => setViewMode('person')} disabled={readOnly} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${ viewMode === 'person' ? 'bg-white text-gray-900 shadow-sm' : readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900' }`}>By Person</button>
            )}
          </div>
          {viewMode === 'person' && (
            <button
              onClick={() => window.print()}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 print:hidden shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print view
            </button>
          )}
        </div>
      )}

      <div id="packing-list-content">
        {viewMode === 'person' && trip.members && trip.members.length > 0 ? (
          <div className="space-y-4">
            {trip.members.map((member) => {
              const items = itemsByPerson[member.id] || []
              const packedCount = items.filter(i => getItemPackedState(i)).length
              const isExpanded = expandedGroups[member.id] ?? true
              const isDropTarget = !readOnly && dragOverTarget === member.id
              return (
                <section
                  key={member.id}
                  onDragOver={(e) => !readOnly && handleDragOverPerson(e, member.id)}
                  onDragLeave={!readOnly ? handleDragLeave : undefined}
                  onDrop={(e) => !readOnly && handleDropPerson(e, member.id)}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${ isDropTarget ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100' }`}
                >
                  <button
                    onClick={() => toggleGroup(member.id)}
                    aria-expanded={isExpanded}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shadow-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-xs text-gray-500">
                          {packedCount}/{items.length} items packed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {items.length > 0 && (
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden print:hidden">
                          <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${(packedCount / items.length) * 100}%` }} />
                        </div>
                      )}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform print:hidden ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-gray-50">
                      {items.length === 0
                        ? <p className="text-sm text-gray-400 py-4 text-center print:hidden">{readOnly ? 'No items assigned to this person' : 'No items assigned · Drag items here'}</p>
                        : <ul className="space-y-2 pt-4" role="list">{items.map(item => renderItem(item))}</ul>
                      }
                    </div>
                  )}
                </section>
              )
            })}
            {itemsByPerson['not-assigned'] && itemsByPerson['not-assigned'].length > 0 && (
              <section
                onDragOver={(e) => !readOnly && handleDragOverPerson(e, null)}
                onDragLeave={!readOnly ? handleDragLeave : undefined}
                onDrop={(e) => !readOnly && handleDropPerson(e, null)}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${ !readOnly && dragOverTarget === 'not-assigned-person' ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100' }`}
              >
                <button onClick={() => toggleGroup('not-assigned-person')} aria-expanded={expandedGroups['not-assigned-person'] ?? true} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-gray-400"><User className="w-6 h-6" /></span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Not Assigned</h3>
                      <p className="text-xs text-gray-500">{itemsByPerson['not-assigned'].length} item{itemsByPerson['not-assigned'].length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform print:hidden ${expandedGroups['not-assigned-person'] !== false ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedGroups['not-assigned-person'] !== false && (
                  <div className="px-6 pb-4 border-t border-gray-50">
                    <ul className="space-y-2 pt-4" role="list">{itemsByPerson['not-assigned'].map(item => renderItem(item))}</ul>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : viewMode === 'luggage' && optimisticTripLuggages.length > 0 ? (
          <div className="space-y-4">
            {optimisticTripLuggages.map((tl) => {
              const items = itemsByLuggage[tl.id] || []
              const packedCount = items.filter(i => getItemPackedState(i)).length
              const isExpanded = expandedGroups[tl.id]
              const isDropTarget = !readOnly && dragOverTarget === tl.id
              return (
                <section
                  key={tl.id}
                  onDragOver={(e) => !readOnly && handleDragOver(e, tl.id)}
                  onDragLeave={!readOnly ? handleDragLeave : undefined}
                  onDrop={(e) => !readOnly && handleDrop(e, tl.id)}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${ isDropTarget ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100' }`}
                >
                  <button
                    onClick={() => toggleGroup(tl.id)}
                    aria-expanded={isExpanded}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getLuggageIcon(tl)}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{tl.luggage.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {tl.luggage.type}
                          {tl.luggage.capacity && ` · ${tl.luggage.capacity}L`}
                          {' · '}{packedCount}/{items.length} items packed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {items.length > 0 && (
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${(packedCount / items.length) * 100}%` }} />
                        </div>
                      )}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-gray-50">
                      {items.length === 0
                        ? <p className="text-sm text-gray-400 py-4 text-center">{readOnly ? 'No items in this bag' : 'No items assigned · Drag items here'}</p>
                        : <ul className="space-y-2 pt-4" role="list">{items.map(item => renderItem(item))}</ul>
                      }
                    </div>
                  )}
                </section>
              )
            })}
            {itemsByLuggage['not-assigned'].length > 0 && (
              <section
                onDragOver={(e) => !readOnly && handleDragOver(e, null)}
                onDragLeave={!readOnly ? handleDragLeave : undefined}
                onDrop={(e) => !readOnly && handleDrop(e, null)}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${ !readOnly && dragOverTarget === 'not-assigned' ? 'border-blue-500 border-2 bg-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100' }`}
              >
                <button onClick={() => toggleGroup('not-assigned')} aria-expanded={expandedGroups['not-assigned']} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">☐</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Not Assigned</h3>
                      <p className="text-xs text-gray-500">{itemsByLuggage['not-assigned'].length} item{itemsByLuggage['not-assigned'].length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedGroups['not-assigned'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedGroups['not-assigned'] && (
                  <div className="px-6 pb-4 border-t border-gray-50">
                    <ul className="space-y-2 pt-4" role="list">{itemsByLuggage['not-assigned'].map(item => renderItem(item))}</ul>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          optimisticLists.map((list) => (
            <article key={list.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <header className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{list.name}</h3>
                {!readOnly && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleShareToClaim(list.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {shareLinkCopied === list.id ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Share2 className="w-4 h-4" /> Share to Claim</>
                    )}
                  </button>
                )}
              </header>
              <div className="divide-y divide-gray-50">
                {list.categories.map((category) => (
                  <section key={category.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{category.name}</h4>
                      <span className="text-xs text-gray-400">
                        {category.items.filter(i => getItemPackedState(i)).length}/{category.items.length}
                      </span>
                    </div>
                    <ul className="space-y-2" role="list">
                      {category.items
                        .filter(item => !item.packLast)
                        .map((item) => {
                          const isPacked = getItemPackedState(item)
                          return (
                            <li
                              key={item.id}
                              draggable={!readOnly && optimisticTripLuggages.length > 0}
                              onDragStart={(e) => handleDragStart(e, item.id, category.id, list.id)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-3 group ${ !readOnly && optimisticTripLuggages.length > 0 ? 'cursor-move' : '' }`}
                            >
                              <div className="flex-1 flex flex-col gap-1">
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input type="checkbox" checked={isPacked} onChange={() => handleToggle(item.id, category.id, list.id, isPacked)} className="sr-only peer" />
                                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 ${ isPacked ? 'bg-green-500 border-green-500' : 'border-gray-300' } peer-hover:border-blue-400`}>
                                    {isPacked && <svg className="w-3 h-3 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-sm ${ isPacked ? 'line-through text-gray-400' : 'text-gray-700' }`}>
                                        {item.quantity > 1 && <span className="font-medium mr-1">{item.quantity}x</span>}
                                        {item.name}
                                      </span>

                                      {item.guestClaimant && (
                                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full ml-1 border border-purple-200">
                                          Claimed by {item.guestClaimant}
                                        </span>
                                      )}

                                      {!readOnly && trip.members && trip.members.length > 0 && (
                                        <div className="relative inline-block">
                                          <button
                                            onClick={(e) => { e.preventDefault(); setAssigningItem(assigningItem === item.id ? null : item.id); }}
                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${item.assignee ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100'}`}
                                          >
                                            {item.assignee ? (
                                              <>
                                                <div className="w-3.5 h-3.5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[8px] font-bold">
                                                  {item.assignee.name.charAt(0).toUpperCase()}
                                                </div>
                                                {item.assignee.name}
                                              </>
                                            ) : (
                                              <>
                                                <User className="w-3 h-3" /> Claim
                                              </>
                                            )}
                                          </button>

                                          {assigningItem === item.id && (
                                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1" onClick={e => e.preventDefault()}>
                                              <button
                                                onClick={() => handleAssignMember(item.id, category.id, list.id, null, null)}
                                                className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                              >
                                                <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                                                Unassigned
                                                {!item.assigneeId && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                                              </button>
                                              {trip.members.map(member => (
                                                <button
                                                  key={member.id}
                                                  onClick={() => handleAssignMember(item.id, category.id, list.id, member.id, member)}
                                                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                                >
                                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                  </div>
                                                  {member.name}
                                                  {item.assigneeId === member.id && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {editingNotes?.id === item.id ? (
                                      <div className="mt-1 flex items-start gap-1" onClick={e => e.preventDefault()}>
                                        <textarea
                                          autoFocus
                                          value={editingNotes?.notes || ""}
                                          onChange={(e) => setEditingNotes({ id: item.id, notes: e.target.value })}
                                          placeholder="Add notes (e.g. buying there)..."
                                          className="text-xs p-1.5 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                          rows={2}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault()
                                              handleUpdateNotes(item.id, category.id, list.id, editingNotes?.notes || "")
                                              setEditingNotes(null)
                                            } else if (e.key === 'Escape') {
                                              setEditingNotes(null)
                                            }
                                          }}
                                        />
                                        <div className="flex flex-col gap-1">
                                          <button
                                            onClick={() => {
                                              handleUpdateNotes(item.id, category.id, list.id, editingNotes?.notes || "")
                                              setEditingNotes(null)
                                            }}
                                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                          ><Check className="w-3 h-3" /></button>
                                          <button onClick={() => setEditingNotes(null)} className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"><X className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                    ) : item.notes ? (
                                      <p
                                        onClick={(e) => { e.preventDefault(); if(!readOnly) setEditingNotes({ id: item.id, notes: item.notes || '' }); }}
                                        className={`text-xs mt-0.5 text-gray-500 flex items-start gap-1 ${!readOnly ? 'cursor-pointer hover:text-gray-700' : ''}`}
                                      >
                                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {item.notes}
                                      </p>
                                    ) : null}
                                  </div>
                                </label>
                              </div>
                              {!readOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                  <button
                                    onClick={(e) => { e.preventDefault(); setEditingNotes({ id: item.id, notes: item.notes || '' }) }}
                                    title="Add/Edit Note"
                                    aria-label="Add or edit note"
                                    className="text-xs p-1 rounded-full border bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center"
                                  ><MessageSquare className="w-3.5 h-3.5" /></button>
                                  <button
                                    onClick={() => handleTogglePackLast(item.id, category.id, list.id, item.packLast)}
                                    title="Add to departure checklist"
                                    aria-label={item.packLast ? 'Remove from departure checklist' : 'Add to departure checklist'}
                                    className="text-xs p-1 rounded-full border bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center justify-center"
                                  ><Sunrise className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDelete(item.id, category.id, list.id)} aria-label="Remove item" className="text-red-400 hover:text-red-600 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 flex items-center"><X className="w-4 h-4" /></button>
                                </div>
                              )}
                            </li>
                          )
                        })}
                    </ul>
                    {!readOnly && (addingTo === category.id ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="text" placeholder="Item name"
                            value={newItemName[category.id] || ''}
                            onChange={(e) => setNewItemName(prev => ({ ...prev, [category.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id, list.id)}
                            className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          {trip.members && trip.members.length > 0 && (
                            <select
                              value={newItemAssignee[category.id] || ''}
                              onChange={(e) => setNewItemAssignee(prev => ({ ...prev, [category.id]: e.target.value }))}
                              className="text-sm px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Who is this for?</option>
                              {trip.members.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAddItem(category.id, list.id)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Add</button>
                          <button onClick={() => { setAddingTo(null); setAddError(null) }} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingTo(category.id)} aria-label={`+ Add item to ${category.name}`} className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">+ Add item</button>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {!readOnly && showInventoryPicker && (
        <InventoryPickerModal tripId={trip.id} onClose={() => setShowInventoryPicker(false)} onSuccess={handleInventorySuccess} />
      )}
      {!readOnly && showPasteList && (
        <PasteListModal tripId={trip.id} onClose={() => setShowPasteList(false)} onSuccess={handlePasteListSuccess} />
      )}
      {!readOnly && showLuggagePicker && (
        <LuggagePickerModal tripId={trip.id} onClose={() => setShowLuggagePicker(false)} onSuccess={handleLuggageSuccess} />
      )}
    </div>
  )
}

export function getTripLocalStorageState(tripId: string): Record<string, boolean> | null {
  if (typeof window === 'undefined') return null
  const storageKey = `${STORAGE_KEY_PREFIX}${tripId}`
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return parsed.packedItems || null
    } catch (e) {
      console.error('Failed to parse localStorage state:', e)
      return null
    }
  }
  return null
}
