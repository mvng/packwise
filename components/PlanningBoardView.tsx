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
import {
  getDayPlansForTrip,
  upsertDayPlan,
  addDayPlanItem,
  deleteDayPlanItem,
  reorderDayPlanItems,
  moveDayPlanItem,
  saveDayPlanItemsToInventory,
} from '@/actions/day-plan.actions'
import InventoryPickerModal from '@/components/inventory/InventoryPickerModal'

// ─── Types ─────────────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── DraggableCard ────────────────────────────────────────────────────────────────

function DraggableCard({
  item,
  tripId,
  onDelete,
}: {
  item: DayPlanItem
  tripId: string
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
      className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm group cursor-grab active:cursor-grabbing relative"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.quantity > 1 && (
              <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                {item.quantity}x
              </span>
            )}
            <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
          </div>
          {item.category && (
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${getCategoryColor(
                item.category
              )}`}
            >
              {item.category}
            </span>
          )}
          {item.notes && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.notes}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-base leading-none flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
          aria-label="Delete item"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ─── AddItemForm ───────────────────────────────────────────────────────────────────

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

  const inputCls =
    'text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  if (!open) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          + Add item
        </button>
        <div>
          <button
            onClick={onOpenInventory}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            ＋ From Inventory
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        autoFocus
        type="text"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        className={inputCls}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={inputCls}
      >
        <option>Outfit</option>
        <option>Gear</option>
        <option>Toiletries</option>
        <option>Accessories</option>
        <option>Other</option>
      </select>
      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className={inputCls}
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={inputCls}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add
        </button>
        <button
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── DayColumn ───────────────────────────────────────────────────────────────────────

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
    const result = await upsertDayPlan(tripId, dateKey, labelInput || undefined)
    if ('dayPlan' in result) {
      onDayPlanChange(dateKey, result.dayPlan as unknown as DayPlan)
    }
  }

  async function handleAddItem(
    item: Omit<DayPlanItem, 'id' | 'dayPlanId' | 'order'>
  ) {
    let targetDayPlan = dayPlan

    if (!targetDayPlan) {
      const result = await upsertDayPlan(tripId, dateKey)
      if ('error' in result) throw new Error(result.error)
      targetDayPlan = result.dayPlan as unknown as DayPlan
      onDayPlanChange(dateKey, targetDayPlan)
    }

    const tempId = `temp-${Date.now()}`
    const tempItem: DayPlanItem = {
      id: tempId,
      dayPlanId: targetDayPlan.id,
      order: targetDayPlan.items?.length ?? 0,
      ...item,
    }

    const optimistic: DayPlan = {
      ...targetDayPlan,
      items: [...(targetDayPlan.items ?? []), tempItem],
    }
    onDayPlanChange(dateKey, optimistic)

    startTransition(async () => {
      const result = await addDayPlanItem(targetDayPlan!.id, item)
      if ('error' in result) {
        const rollback: DayPlan = {
          ...optimistic,
          items: optimistic.items.filter((i) => i.id !== tempId),
        }
        onDayPlanChange(dateKey, rollback)
        return
      }
      const withReal: DayPlan = {
        ...optimistic,
        items: optimistic.items.map((i) =>
          i.id === tempId ? (result.item as unknown as DayPlanItem) : i
        ),
      }
      onDayPlanChange(dateKey, withReal)
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!dayPlan) return
    const optimistic: DayPlan = {
      ...dayPlan,
      items: dayPlan.items.filter((i) => i.id !== itemId),
    }
    onDayPlanChange(dateKey, optimistic)
    startTransition(async () => {
      await deleteDayPlanItem(itemId, tripId)
    })
  }

  function handleSaveToInventory() {
    if (!dayPlan) return
    startTransition(async () => {
      const result = await saveDayPlanItemsToInventory(dayPlan.id)
      if ('saved' in result) {
        setToast('Saved to inventory ✓')
        setTimeout(() => setToast(null), 2500)
      }
    })
  }

  async function handleInventoryItems(invItems: InventoryItemData[]) {
    for (const item of invItems) {
      await handleAddItem({
        name: item.name,
        category: null,
        quantity: item.quantity,
        notes: item.notes ?? null,
      })
    }
  }

  const items = dayPlan?.items ?? []

  return (
    <>
      <div className="min-w-[85vw] sm:w-[268px] flex-shrink-0 flex flex-col">
        {/* Column header */}
        <div className="bg-gray-100 rounded-t-2xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">{formatColumnDate(date)}</p>
          <p className="text-xs text-gray-400">Day {dayIndex + 1}</p>
          {editingLabel ? (
            <input
              autoFocus
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel()
              }}
              className="mt-1 text-xs w-full bg-white border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={() => setEditingLabel(true)}
              className="mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {dayPlan?.label ? (
                <span className="text-xs text-gray-600 font-medium">{dayPlan.label}</span>
              ) : (
                <span className="text-xs text-gray-300 italic">+ Add label</span>
              )}
            </button>
          )}
        </div>

        {/* Column body */}
        <div className="bg-white border border-gray-100 rounded-b-2xl shadow-sm flex flex-col flex-1">
          {/* Card list */}
          <div className="flex-1 overflow-y-auto max-h-[58vh] p-3 space-y-2">
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DraggableCard
                      item={item}
                      tripId={tripId}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3 space-y-2">
            {items.length > 0 && (
              <div>
                {toast ? (
                  <p className="text-xs text-indigo-500 py-1">{toast}</p>
                ) : (
                  <button
                    onClick={handleSaveToInventory}
                    className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors w-full text-left py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    ↓ Save to Inventory
                  </button>
                )}
              </div>
            )}
            <AddItemForm
              onAdd={handleAddItem}
              onOpenInventory={() => setShowInventoryPicker(true)}
            />
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

// ─── PlanningBoardView ───────────────────────────────────────────────────────────────

export default function PlanningBoardView({ trip }: PlanningBoardViewProps) {
  const days = generateDays(trip.startDate, trip.endDate)
  const [dayPlans, setDayPlans] = useState<DayPlanMap>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    getDayPlansForTrip(trip.id).then((result) => {
      if ('dayPlans' in result) {
        const map: DayPlanMap = {}
        for (const dp of result.dayPlans) {
          const key = new Date(dp.date).toISOString().split('T')[0]
          map[key] = dp as unknown as DayPlan
        }
        setDayPlans(map)
      }
    })
  }, [trip.id])

  const handleDayPlanChange = useCallback((dateKey: string, updated: DayPlan) => {
    setDayPlans((prev) => ({ ...prev, [dateKey]: updated }))
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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
      // Reorder within same column
      const oldIndex = sourcePlan.items.findIndex((i) => i.id === active.id)
      const newIndex = sourcePlan.items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(sourcePlan.items, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        order: idx,
      }))
      setDayPlans((prev) => ({
        ...prev,
        [sourceKey]: { ...sourcePlan, items: reordered },
      }))
      startTransition(async () => {
        await reorderDayPlanItems(sourcePlan.id, reordered.map((i) => i.id), trip.id)
      })
    } else {
      // Move between columns
      const destPlan = dayPlans[destKey]
      const movingItem = sourcePlan.items.find((i) => i.id === active.id)
      if (!movingItem || !destPlan) return

      const newOrder = destPlan.items.length
      const updatedSource: DayPlan = {
        ...sourcePlan,
        items: sourcePlan.items.filter((i) => i.id !== active.id),
      }
      const updatedDest: DayPlan = {
        ...destPlan,
        items: [
          ...destPlan.items,
          { ...movingItem, dayPlanId: destPlan.id, order: newOrder },
        ],
      }
      setDayPlans((prev) => ({
        ...prev,
        [sourceKey]: updatedSource,
        [destKey]: updatedDest,
      }))
      startTransition(async () => {
        await moveDayPlanItem(active.id as string, destPlan.id, newOrder, trip.id)
      })
    }
  }

  const activeItem = activeId
    ? Object.values(dayPlans)
        .flatMap((dp) => dp.items)
        .find((i) => i.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="w-full overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="inline-flex gap-3 pb-4 px-1 min-w-max">
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
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg opacity-90 w-[240px]">
            <span className="text-sm font-medium text-gray-800">{activeItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
