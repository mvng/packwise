// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DayPlan, DayPlanItem } from '@/types'
import type { InventoryItemData } from '@/types/inventory'
import InventoryPickerModal from '@/components/inventory/InventoryPickerModal'

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiUpsertDayPlan(tripId: string, date: string, label?: string) {
  const res = await fetch(`/api/day-plans/${tripId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, label }),
  })
  return res.json()
}

async function apiAddDayPlanItem(
  dayPlanId: string,
  item: { name: string; category?: string | null; quantity?: number; notes?: string | null }
) {
  const res = await fetch('/api/day-plan-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayPlanId, ...item }),
  })
  return res.json()
}

async function apiDeleteDayPlanItem(itemId: string) {
  await fetch(`/api/day-plan-items/${itemId}`, { method: 'DELETE' })
}

async function apiReorderDayPlanItems(dayPlanId: string, orderedIds: string[]) {
  await fetch('/api/day-plan-items/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayPlanId, orderedIds }),
  })
}

async function apiMoveDayPlanItem(itemId: string, dayPlanId: string, order: number) {
  await fetch(`/api/day-plan-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayPlanId, order }),
  })
}

async function apiSaveDayPlanItemsToInventory(dayPlanId: string) {
  const res = await fetch('/api/day-plan-items/save-to-inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayPlanId }),
  })
  return res.json()
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanningBoardViewProps {
  trip: {
    id: string
    startDate: Date | string
    endDate: Date | string
  }
}

type DayPlanMap = Record<string, DayPlan>

const CATEGORY_COLORS: Record<string, string> = {
  Outfit: 'bg-purple-100 text-purple-700',
  Gear: 'bg-green-100 text-green-700',
  Toiletries: 'bg-blue-100 text-blue-700',
  Accessories: 'bg-yellow-100 text-yellow-700',
}

function getCategoryColor(category?: string | null) {
  return category && CATEGORY_COLORS[category]
    ? CATEGORY_COLORS[category]
    : 'bg-gray-100 text-gray-600'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDays(startDate: Date | string, endDate: Date | string): Date[] {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const days: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatColumnDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── DraggableCard ────────────────────────────────────────────────────────────

function DraggableCard({
  item,
  onDelete,
}: {
  item: DayPlanItem
  onDelete: (itemId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow-sm group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.quantity > 1 && (
            <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">{item.quantity}×</span>
          )}
          <span className="text-xs font-medium text-gray-800 truncate">{item.name}</span>
          {item.category && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-sm leading-none flex-shrink-0 focus:outline-none rounded ml-1"
          aria-label="Delete item"
        >
          ×
        </button>
      </div>
      {item.notes && (
        <p className="text-[11px] text-gray-400 truncate mt-0.5 pl-0.5">{item.notes}</p>
      )}
    </div>
  )
}

// ─── AddItemForm ──────────────────────────────────────────────────────────────

function AddItemForm({
  onAdd,
  onOpenInventory,
}: {
  onAdd: (item: Omit<DayPlanItem, 'id' | 'dayPlanId' | 'order'>) => Promise<void>
  onOpenInventory: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Outfit')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setError(null)
    try {
      await onAdd({ name: name.trim(), category, quantity, notes: notes.trim() || null })
      setName('')
      setCategory('Outfit')
      setQuantity(1)
      setNotes('')
      setOpen(false)
    } catch (e: any) {
      setError(e.message || 'Failed to add item')
    }
  }

  const inputCls = 'text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  if (!open) {
    return (
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => setOpen(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium focus:outline-none rounded">
          + Add item
        </button>
        <button onClick={onOpenInventory} className="text-xs text-gray-400 hover:text-blue-500 transition-colors focus:outline-none rounded">
          + From Inventory
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 pt-1">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input autoFocus type="text" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }} className={inputCls} />
      <div className="flex gap-1.5">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
          <option>Outfit</option>
          <option>Gear</option>
          <option>Toiletries</option>
          <option>Accessories</option>
          <option>Other</option>
        </select>
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={`${inputCls} w-16`} />
      </div>
      <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} className="bg-blue-500 text-white rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-blue-600 focus:outline-none">Add</button>
        <button onClick={() => { setOpen(false); setError(null) }} className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none">Cancel</button>
      </div>
    </div>
  )
}

// ─── DayColumn ────────────────────────────────────────────────────────────────

function DayColumn({
  date,
  dayIndex,
  tripId,
  dayPlan,
  onDayPlanChange,
}: {
  date: Date
  dayIndex: number
  tripId: string
  dayPlan: DayPlan | undefined
  onDayPlanChange: (dateKey: string, updated: DayPlan) => void
}) {
  const dateKey = toDateKey(date)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(dayPlan?.label ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [showInventoryPicker, setShowInventoryPicker] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setLabelInput(dayPlan?.label ?? '')
  }, [dayPlan?.label])

  async function saveLabel() {
    setEditingLabel(false)
    const result = await apiUpsertDayPlan(tripId, dateKey, labelInput || undefined)
    if (result.dayPlan) onDayPlanChange(dateKey, result.dayPlan)
  }

  async function handleAddItem(item: Omit<DayPlanItem, 'id' | 'dayPlanId' | 'order'>) {
    let targetDayPlan = dayPlan

    if (!targetDayPlan) {
      const result = await apiUpsertDayPlan(tripId, dateKey)
      if (result.error) throw new Error(result.error)
      targetDayPlan = result.dayPlan
      onDayPlanChange(dateKey, targetDayPlan)
    }

    const tempId = `temp-${Date.now()}`
    const optimistic: DayPlan = {
      ...targetDayPlan,
      items: [...(targetDayPlan.items ?? []), { id: tempId, dayPlanId: targetDayPlan.id, order: targetDayPlan.items?.length ?? 0, ...item }],
    }
    onDayPlanChange(dateKey, optimistic)

    startTransition(async () => {
      const result = await apiAddDayPlanItem(targetDayPlan!.id, item)
      if (result.error) {
        onDayPlanChange(dateKey, { ...optimistic, items: optimistic.items.filter((i) => i.id !== tempId) })
        return
      }
      onDayPlanChange(dateKey, { ...optimistic, items: optimistic.items.map((i) => i.id === tempId ? result.item : i) })
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!dayPlan) return
    onDayPlanChange(dateKey, { ...dayPlan, items: dayPlan.items.filter((i) => i.id !== itemId) })
    startTransition(async () => { await apiDeleteDayPlanItem(itemId) })
  }

  function handleSaveToInventory() {
    if (!dayPlan) return
    startTransition(async () => {
      const result = await apiSaveDayPlanItemsToInventory(dayPlan.id)
      if (result.saved != null) {
        setToast('Saved ✓')
        setTimeout(() => setToast(null), 2500)
      }
    })
  }

  async function handleInventoryItems(invItems: InventoryItemData[]) {
    for (const item of invItems) {
      await handleAddItem({ name: item.name, category: null, quantity: item.quantity, notes: item.notes ?? null })
    }
  }

  const items = dayPlan?.items ?? []

  return (
    <>
      <div className="w-[200px] flex-shrink-0 flex flex-col">
        {/* Column header */}
        <div className="bg-gray-50 border border-gray-200 rounded-t-xl px-3 py-2">
          <div className="flex items-baseline justify-between gap-1">
            <p className="text-xs font-semibold text-gray-700 truncate">{formatColumnDate(date)}</p>
            <span className="text-[10px] text-gray-400 flex-shrink-0">Day {dayIndex + 1}</span>
          </div>
          {editingLabel ? (
            <input
              autoFocus
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => { if (e.key === 'Enter') saveLabel() }}
              className="mt-1 text-[11px] w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="mt-0.5 focus:outline-none rounded">
              {dayPlan?.label
                ? <span className="text-[11px] text-gray-500 font-medium">{dayPlan.label}</span>
                : <span className="text-[11px] text-gray-300 italic">+ label</span>}
            </button>
          )}
        </div>

        {/* Column body */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto max-h-[55vh] p-2 space-y-1">
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <DraggableCard item={item} onDelete={handleDeleteItem} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </div>

          <div className="px-2 pb-2">
            {items.length > 0 && (
              <div className="mb-1">
                {toast
                  ? <p className="text-[11px] text-indigo-500">{toast}</p>
                  : <button onClick={handleSaveToInventory} className="text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition-colors focus:outline-none">↓ Save to inventory</button>
                }
              </div>
            )}
            <AddItemForm onAdd={handleAddItem} onOpenInventory={() => setShowInventoryPicker(true)} />
          </div>
        </div>
      </div>

      {showInventoryPicker && (
        <InventoryPickerModal
          tripId={tripId}
          onClose={() => setShowInventoryPicker(false)}
          onSuccess={() => {}}
          onAddItems={handleInventoryItems}
        />
      )}
    </>
  )
}

// ─── PlanningBoardView ────────────────────────────────────────────────────────

export default function PlanningBoardView({ trip }: PlanningBoardViewProps) {
  const days = generateDays(trip.startDate, trip.endDate)
  const [dayPlans, setDayPlans] = useState<DayPlanMap>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/day-plans/${trip.id}`)
        if (!res.ok) return
        const data = await res.json()
        const map: DayPlanMap = {}
        for (const dp of data.dayPlans ?? []) {
          const key = new Date(dp.date).toISOString().split('T')[0]
          map[key] = dp as DayPlan
        }
        setDayPlans(map)
      } catch (e) {
        console.error('Failed to load day plans', e)
      }
    }
    load()
  }, [trip.id])

  const handleDayPlanChange = useCallback((dateKey: string, updated: DayPlan) => {
    setDayPlans((prev) => ({ ...prev, [dateKey]: updated }))
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function findColumnKeyForItem(itemId: string): string | null {
    for (const [key, dp] of Object.entries(dayPlans)) {
      if (dp.items.some((i) => i.id === itemId)) return key
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceKey = findColumnKeyForItem(active.id as string)
    const destKey = findColumnKeyForItem(over.id as string)
    if (!sourceKey) return

    const sourcePlan = dayPlans[sourceKey]

    if (!destKey || sourceKey === destKey) {
      const oldIndex = sourcePlan.items.findIndex((i) => i.id === active.id)
      const newIndex = sourcePlan.items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(sourcePlan.items, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx }))
      setDayPlans((prev) => ({ ...prev, [sourceKey]: { ...sourcePlan, items: reordered } }))
      startTransition(async () => { await apiReorderDayPlanItems(sourcePlan.id, reordered.map((i) => i.id)) })
    } else {
      const destPlan = dayPlans[destKey]
      const movingItem = sourcePlan.items.find((i) => i.id === active.id)
      if (!movingItem || !destPlan) return
      const newOrder = destPlan.items.length
      setDayPlans((prev) => ({
        ...prev,
        [sourceKey]: { ...sourcePlan, items: sourcePlan.items.filter((i) => i.id !== active.id) },
        [destKey]: { ...destPlan, items: [...destPlan.items, { ...movingItem, dayPlanId: destPlan.id, order: newOrder }] },
      }))
      startTransition(async () => { await apiMoveDayPlanItem(active.id as string, destPlan.id, newOrder) })
    }
  }

  const activeItem = activeId
    ? Object.values(dayPlans).flatMap((dp) => dp.items).find((i) => i.id === activeId)
    : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="inline-flex gap-2 pb-4 px-1 min-w-max">
          {days.map((date, index) => {
            const key = toDateKey(date)
            return (
              <DayColumn
                key={key}
                date={date}
                dayIndex={index}
                tripId={trip.id}
                dayPlan={dayPlans[key]}
                onDayPlanChange={handleDayPlanChange}
              />
            )
          })}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-lg opacity-90 w-[180px]">
            <span className="text-xs font-medium text-gray-800">{activeItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
