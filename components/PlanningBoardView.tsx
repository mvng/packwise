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
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
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
import { TAG_CATEGORY, encodeTagItem, decodeItem } from '@/lib/dayPlanItem'

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

async function apiUpdateDayPlanItemNotes(itemId: string, notes: string | null) {
  await fetch(`/api/day-plan-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sort timed inline tags by time; untimed and non-tag items keep relative order.
// Only called explicitly (on time change or initial load), never during render.
function applyTimeSort(items: DayPlanItem[]): DayPlanItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.category === TAG_CATEGORY ? a.notes ?? null : null
    const bTime = b.category === TAG_CATEGORY ? b.notes ?? null : null
    if (aTime && bTime) return aTime.localeCompare(bTime)
    // Timed item floats above untimed
    if (aTime && !bTime) return -1
    if (!aTime && bTime) return 1
    return 0
  })
}

// ─── Day Function Tags ────────────────────────────────────────────────────────

export interface DayTag {
  id: string
  label: string
  icon: string
  colors: { headerBg: string; headerText: string; border: string; bodyBg: string; chip: string; inlineBg: string; inlineBorder: string; inlineText: string }
}

export const DAY_TAGS: DayTag[] = [
  { id: 'travel', label: 'Travel Day', icon: '✈️', colors: { headerBg: 'bg-sky-500', headerText: 'text-white', border: 'border-sky-300', bodyBg: 'bg-sky-50', chip: 'bg-sky-100 text-sky-700', inlineBg: 'bg-sky-50', inlineBorder: 'border-sky-200', inlineText: 'text-sky-700' } },
  { id: 'workout', label: 'Workout', icon: '🏋️', colors: { headerBg: 'bg-orange-500', headerText: 'text-white', border: 'border-orange-300', bodyBg: 'bg-orange-50', chip: 'bg-orange-100 text-orange-700', inlineBg: 'bg-orange-50', inlineBorder: 'border-orange-200', inlineText: 'text-orange-700' } },
  { id: 'laundry', label: 'Laundry Day', icon: '🧺', colors: { headerBg: 'bg-teal-500', headerText: 'text-white', border: 'border-teal-300', bodyBg: 'bg-teal-50', chip: 'bg-teal-100 text-teal-700', inlineBg: 'bg-teal-50', inlineBorder: 'border-teal-200', inlineText: 'text-teal-700' } },
  { id: 'rest', label: 'Rest Day', icon: '😴', colors: { headerBg: 'bg-indigo-400', headerText: 'text-white', border: 'border-indigo-200', bodyBg: 'bg-indigo-50', chip: 'bg-indigo-100 text-indigo-600', inlineBg: 'bg-indigo-50', inlineBorder: 'border-indigo-200', inlineText: 'text-indigo-600' } },
  { id: 'adventure', label: 'Adventure', icon: '🧗', colors: { headerBg: 'bg-emerald-500', headerText: 'text-white', border: 'border-emerald-300', bodyBg: 'bg-emerald-50', chip: 'bg-emerald-100 text-emerald-700', inlineBg: 'bg-emerald-50', inlineBorder: 'border-emerald-200', inlineText: 'text-emerald-700' } },
  { id: 'beach', label: 'Beach Day', icon: '🏖️', colors: { headerBg: 'bg-yellow-400', headerText: 'text-yellow-900', border: 'border-yellow-300', bodyBg: 'bg-yellow-50', chip: 'bg-yellow-100 text-yellow-700', inlineBg: 'bg-yellow-50', inlineBorder: 'border-yellow-200', inlineText: 'text-yellow-700' } },
  { id: 'sightseeing', label: 'Sightseeing', icon: '🗺️', colors: { headerBg: 'bg-violet-500', headerText: 'text-white', border: 'border-violet-300', bodyBg: 'bg-violet-50', chip: 'bg-violet-100 text-violet-700', inlineBg: 'bg-violet-50', inlineBorder: 'border-violet-200', inlineText: 'text-violet-700' } },
  { id: 'dining', label: 'Dining Out', icon: '🍽️', colors: { headerBg: 'bg-rose-500', headerText: 'text-white', border: 'border-rose-300', bodyBg: 'bg-rose-50', chip: 'bg-rose-100 text-rose-700', inlineBg: 'bg-rose-50', inlineBorder: 'border-rose-200', inlineText: 'text-rose-700' } },
  { id: 'spa', label: 'Spa / Wellness', icon: '🧖', colors: { headerBg: 'bg-pink-400', headerText: 'text-white', border: 'border-pink-200', bodyBg: 'bg-pink-50', chip: 'bg-pink-100 text-pink-600', inlineBg: 'bg-pink-50', inlineBorder: 'border-pink-200', inlineText: 'text-pink-600' } },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', colors: { headerBg: 'bg-fuchsia-500', headerText: 'text-white', border: 'border-fuchsia-300', bodyBg: 'bg-fuchsia-50', chip: 'bg-fuchsia-100 text-fuchsia-700', inlineBg: 'bg-fuchsia-50', inlineBorder: 'border-fuchsia-200', inlineText: 'text-fuchsia-700' } },
]

function getTagById(id: string | null | undefined): DayTag | null {
  if (!id) return null
  return DAY_TAGS.find((t) => t.id === id || t.label === id) ?? null
}

const TAG_PREFIX = 'tag::'
function makeTagDragId(tagId: string) { return `${TAG_PREFIX}${tagId}` }
function parseTagDragId(id: string): string | null {
  return id.startsWith(TAG_PREFIX) ? id.slice(TAG_PREFIX.length) : null
}

const COL_PREFIX = 'col::'
function makeColDropId(dateKey: string) { return `${COL_PREFIX}${dateKey}` }
function parseColDropId(id: string): string | null {
  return id.startsWith(COL_PREFIX) ? id.slice(COL_PREFIX.length) : null
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanningBoardViewProps {
  trip: { id: string; startDate: Date | string; endDate: Date | string; packingLists?: any[] }
  onUnsyncedItemsChange?: (unsyncedItems: string[]) => void
}
type DayPlanMap = Record<string, DayPlan>

const ITEM_CATEGORY_COLORS: Record<string, string> = {
  Outfit: 'bg-purple-100 text-purple-700',
  Gear: 'bg-green-100 text-green-700',
  Toiletries: 'bg-blue-100 text-blue-700',
  Accessories: 'bg-yellow-100 text-yellow-700',
}
function getItemCategoryColor(cat?: string | null) {
  return cat && ITEM_CATEGORY_COLORS[cat] ? ITEM_CATEGORY_COLORS[cat] : 'bg-gray-100 text-gray-600'
}

function generateDays(start: Date | string, end: Date | string): Date[] {
  const s = new Date(start); s.setHours(0, 0, 0, 0)
  const e = new Date(end); e.setHours(0, 0, 0, 0)
  const days: Date[] = []
  const c = new Date(s)
  while (c <= e) { days.push(new Date(c)); c.setDate(c.getDate() + 1) }
  return days
}
function toDateKey(d: Date) { return d.toISOString().split('T')[0] }
function formatColumnDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── DraggableTagChip ─────────────────────────────────────────────────────────

function DraggableTagChip({ tag }: { tag: DayTag }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: makeTagDragId(tag.id),
    data: { type: 'tag', tagId: tag.id },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:shadow-sm hover:-translate-y-0.5'
      } ${tag.colors.chip}`}
    >
      <span className="text-base leading-none">{tag.icon}</span>
      <span className="text-xs font-medium whitespace-nowrap">{tag.label}</span>
    </div>
  )
}

// ─── InlineTagCard ────────────────────────────────────────────────────────────

function InlineTagCard({
  item,
  onDelete,
  onTimeChange,
}: {
  item: DayPlanItem
  onDelete: (id: string) => void
  onTimeChange: (id: string, time: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editingTime, setEditingTime] = useState(false)
  const [timeInput, setTimeInput] = useState(item.time ?? '')

  useEffect(() => { setTimeInput(item.time ?? '') }, [item.time])

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const tag = getTagById(item.tagId ?? null)
  const c = tag?.colors

  function commitTime() {
    setEditingTime(false)
    const val = timeInput.trim() || null
    onTimeChange(item.id, val)
  }

  function fmtTime(t: string) {
    try {
      const parts = t.split('-')
      if (parts.length > 1) {
        const start = parts[0].trim()
        const end = parts[1].trim()
        const [sh, sm] = start.split(':').map(Number)
        const sd = new Date(); sd.setHours(sh, sm)
        const [eh, em] = end.split(':').map(Number)
        const ed = new Date(); ed.setHours(eh, em)
        const sfmt = sd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        const efmt = ed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        // Simplify "8:00 AM - 9:00 AM" to "8:00 - 9:00 AM" if they share AM/PM, but full is safer.
        return `${sfmt} - ${efmt}`
      }
      const [h, m] = t.split(':').map(Number)
      const d = new Date(); d.setHours(h, m)
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch { return t }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border border-dashed group cursor-grab active:cursor-grabbing ${
        c ? `${c.inlineBg} ${c.inlineBorder} ${c.inlineText}` : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}
    >
      <span {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing">
        <span className="text-sm">{tag?.icon ?? '📍'}</span>
      </span>

      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold">{tag?.label ?? item.name}</span>
        {editingTime ? (
          <input
            autoFocus
            type="text"
            placeholder="e.g. 10:00 or 10:00-11:30"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onBlur={commitTime}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTime() }}
            className="ml-2 text-[11px] bg-white border border-current/20 rounded px-1.5 py-0.5 focus:outline-none w-32"
          />
        ) : (
          <button
            onClick={() => setEditingTime(true)}
            aria-label={item.time ? `Edit time for ${tag?.label ?? item.name}` : `Add time for ${tag?.label ?? item.name}`}
            className="ml-2 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
          >
            {item.time ? fmtTime(item.time) : <span className="italic">+ time</span>}
          </button>
        )}
      </div>

      <button
        aria-label={`Delete ${tag?.label ?? item.name}`}
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded text-current/40 hover:text-red-400 transition-opacity text-sm leading-none flex-shrink-0"
      >×</button>
    </div>
  )
}

// ─── DraggableCard ────────────────────────────────────────────────────────────

function DraggableCard({ item, onDelete }: { item: DayPlanItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  // Simple UI representation for assignee
  const assigneeInitial = item.assignee?.name ? item.assignee.name.charAt(0).toUpperCase() : null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.quantity > 1 && <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">{item.quantity}×</span>}
          <span className="text-xs font-medium text-gray-800 truncate">{item.name}</span>
          {item.category && item.category !== TAG_CATEGORY && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getItemCategoryColor(item.category)}`}>
              {item.category}
            </span>
          )}
          {assigneeInitial && (
            <div
              className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-sm border border-blue-200"
              title={item.assignee?.name}
            >
              {assigneeInitial}
            </div>
          )}
        </div>
        <button
          aria-label={`Delete ${item.name}`}
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded text-gray-300 hover:text-red-400 transition-opacity text-sm leading-none flex-shrink-0 ml-1"
        >×</button>
      </div>
      {item.notes && <p className="text-[11px] text-gray-400 truncate mt-0.5 pl-0.5">{item.notes}</p>}
    </div>
  )
}

// ─── AddItemForm ──────────────────────────────────────────────────────────────

function AddItemForm({ onAdd, onOpenInventory }: {
  onAdd: (item: Omit<DayPlanItem, 'id' | 'dayPlanId' | 'order'>) => Promise<void>
  onOpenInventory: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Outfit')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  async function handleSubmit() {
    if (!name.trim()) return
    await onAdd({ name: name.trim(), category, quantity, notes: notes.trim() || null })
    setName(''); setQuantity(1); setNotes('')
    setOpen(false)
  }

  const inputCls = 'text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bg-white'

  if (!open) return (
    <div className="flex items-center gap-3 pt-1">
      <button onClick={() => setOpen(true)} aria-label="Add new day plan item" className="text-xs text-blue-500 hover:text-blue-700 font-medium">+ Add item</button>
      <button onClick={onOpenInventory} aria-label="Add from inventory" className="text-xs text-gray-400 hover:text-blue-500 transition-colors">+ Inventory</button>
    </div>
  )

  return (
    <div className="space-y-1.5 pt-1">
      <input autoFocus type="text" placeholder="Item name" value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        className={inputCls} />
      <div className="flex gap-1.5">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
          <option>Outfit</option><option>Gear</option><option>Toiletries</option>
          <option>Accessories</option><option>Other</option>
        </select>
        <input type="number" min={1} value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className={`${inputCls} w-16`} />
      </div>
      <input type="text" placeholder="Notes (optional)" value={notes}
        onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} className="bg-blue-500 text-white rounded-lg px-3 py-1 text-xs font-medium hover:bg-blue-600">Add</button>
        <button onClick={() => setOpen(false)} aria-label="Cancel adding item" className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  )
}

// ─── DayColumn ────────────────────────────────────────────────────────────────

function DayColumn({
  date, dayIndex, tripId, dayPlan, isTagOver, onDayPlanChange,
}: {
  date: Date
  dayIndex: number
  tripId: string
  dayPlan: DayPlan | undefined
  isTagOver: boolean
  onDayPlanChange: (dateKey: string, updated: DayPlan) => void
}) {
  const dateKey = toDateKey(date)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(dayPlan?.label ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [showInventoryPicker, setShowInventoryPicker] = useState(false)
  const [, startTransition] = useTransition()

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: makeColDropId(dateKey) })

  useEffect(() => { setLabelInput(dayPlan?.label ?? '') }, [dayPlan?.label])

  // Render items in the order stored in state — no sort on render.
  // applyTimeSort is called explicitly only when a time changes.
  const items = (dayPlan?.items ?? []).map(decodeItem)

  const allDayTag = getTagById(dayPlan?.label)
  const dropping = isTagOver || isOver

  async function saveLabel(value: string) {
    setEditingLabel(false)
    const result = await apiUpsertDayPlan(tripId, dateKey, value || undefined)
    if (result.dayPlan) onDayPlanChange(dateKey, result.dayPlan)
  }

  async function ensurePlan(): Promise<DayPlan | null> {
    if (dayPlan) return dayPlan
    const result = await apiUpsertDayPlan(tripId, dateKey)
    if (result.error || !result.dayPlan) return null
    onDayPlanChange(dateKey, result.dayPlan)
    return result.dayPlan
  }

  async function handleAddItem(item: Omit<DayPlanItem, 'id' | 'dayPlanId' | 'order'>) {
    const plan = await ensurePlan()
    if (!plan) return
    const tempId = `temp-${Date.now()}`
    const optimistic: DayPlan = {
      ...plan,
      items: [...(plan.items ?? []), { id: tempId, dayPlanId: plan.id, order: plan.items?.length ?? 0, ...item }],
    }
    onDayPlanChange(dateKey, optimistic)
    startTransition(async () => {
      const result = await apiAddDayPlanItem(plan.id, item)
      if (result.error) { onDayPlanChange(dateKey, { ...optimistic, items: optimistic.items.filter((i) => i.id !== tempId) }); return }
      onDayPlanChange(dateKey, { ...optimistic, items: optimistic.items.map((i) => i.id === tempId ? result.item : i) })
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!dayPlan) return
    onDayPlanChange(dateKey, { ...dayPlan, items: dayPlan.items.filter((i) => i.id !== itemId) })
    startTransition(async () => { await apiDeleteDayPlanItem(itemId) })
  }

  function handleTimeChange(itemId: string, time: string | null) {
    if (!dayPlan) return
    // Update the time on the item, then re-sort by time
    const updated = dayPlan.items.map((i) => i.id === itemId ? { ...i, notes: time } : i)
    const sorted = applyTimeSort(updated)
    onDayPlanChange(dateKey, { ...dayPlan, items: sorted })
    startTransition(async () => {
      await apiUpdateDayPlanItemNotes(itemId, time)
      // Persist the new order to DB after sort
      await apiReorderDayPlanItems(dayPlan.id, sorted.map((i) => i.id))
    })
  }

  function handleSaveToInventory() {
    if (!dayPlan) return
    startTransition(async () => {
      const result = await apiSaveDayPlanItemsToInventory(dayPlan.id)
      if (result.saved != null) { setToast('Saved ✓'); setTimeout(() => setToast(null), 2500) }
    })
  }

  async function handleInventoryItems(invItems: InventoryItemData[]) {
    for (const item of invItems) {
      await handleAddItem({ name: item.name, category: null, quantity: item.quantity, notes: item.notes ?? null })
    }
  }

  const headerBg = allDayTag ? allDayTag.colors.headerBg : dropping ? 'bg-blue-100' : 'bg-gray-50'
  const headerText = allDayTag ? allDayTag.colors.headerText : 'text-gray-700'
  const borderColor = allDayTag ? allDayTag.colors.border : dropping ? 'border-blue-400' : 'border-gray-200'
  const bodyBg = allDayTag ? allDayTag.colors.bodyBg : 'bg-white'

  return (
    <>
      <div className={`w-[248px] flex-shrink-0 flex flex-col rounded-xl border-2 transition-all duration-150 ${borderColor}`}>
        <div
          ref={setDropRef}
          className={`relative rounded-t-xl px-3 py-2.5 transition-colors duration-150 ${headerBg} ${dropping && !allDayTag ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
        >
          <div className="flex items-baseline justify-between gap-1">
            <p className={`text-xs font-bold truncate ${headerText}`}>{formatColumnDate(date)}</p>
            <span className={`text-[10px] flex-shrink-0 opacity-60 ${headerText}`}>Day {dayIndex + 1}</span>
          </div>

          {allDayTag ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm">{allDayTag.icon}</span>
              <span className={`text-[11px] font-semibold ${headerText} opacity-90`}>{allDayTag.label}</span>
              <span className={`text-[10px] ml-0.5 opacity-50 ${headerText}`}>— all day</span>
              <button onClick={() => saveLabel('')} aria-label="Remove all day tag" className={`ml-auto text-[11px] opacity-60 hover:opacity-100 ${headerText} focus:outline-none leading-none`}>✕</button>
            </div>
          ) : editingLabel ? (
            <input autoFocus type="text" value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={() => saveLabel(labelInput)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(labelInput) }}
              className="mt-1 text-[11px] w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} aria-label={dayPlan?.label ? "Edit day label" : "Add day label"} className="mt-0.5 focus:outline-none rounded w-full text-left">
              {dayPlan?.label
                ? <span className="text-[11px] text-gray-500 font-medium">{dayPlan.label}</span>
                : <span className={`text-[11px] italic ${dropping ? 'text-blue-400' : 'text-gray-300'}`}>
                    {dropping ? 'Drop for all-day tag' : 'drop tag or add label…'}
                  </span>}
            </button>
          )}
        </div>

        <div className={`${bodyBg} rounded-b-xl flex flex-col flex-1 transition-colors duration-150`}>
          <div className="flex-1 overflow-y-auto max-h-[52vh] p-2.5 space-y-1.5">
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.1 }}
                  >
                    {item.itemType === 'tag' ? (
                      <InlineTagCard item={item} onDelete={handleDeleteItem} onTimeChange={handleTimeChange} />
                    ) : (
                      <DraggableCard item={item} onDelete={handleDeleteItem} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
            {items.length === 0 && (
              <p className="text-[11px] text-gray-300 italic text-center pt-4">Nothing planned yet</p>
            )}
          </div>
          <div className="px-2.5 pb-2.5">
            {items.filter(i => i.itemType !== 'tag').length > 0 && (
              <div className="mb-1.5">
                {toast
                  ? <p className="text-[11px] text-indigo-500">{toast}</p>
                  : <button onClick={handleSaveToInventory} aria-label="Save day plan items to inventory" className="text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition-colors">↓ Save to inventory</button>
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
          onSuccess={() =>{}}
          onAddItems={handleInventoryItems}
        />
      )}
    </>
  )
}

// ─── DayDetailView ─────────────────────────────────────────────────────────────

// Start at 4 AM, end at 11 PM (20 hours total)
const HOURS = Array.from({ length: 20 }, (_, i) => i + 4)

const SLOT_PREFIX = 'slot::'
function makeTimeSlotDropId(dateKey: string, hour: number) { return `${SLOT_PREFIX}${dateKey}::${hour}` }
function parseTimeSlotDropId(id: string): { dateKey: string; hour: number } | null {
  if (!id.startsWith(SLOT_PREFIX)) return null
  const [dateKey, hourStr] = id.slice(SLOT_PREFIX.length).split('::')
  return { dateKey, hour: parseInt(hourStr, 10) }
}

function DayDetailView({
  date,
  dayIndex,
  tripId,
  dayPlan,
  isTagOver,
  onDayPlanChange,
}: {
  date: Date
  dayIndex: number
  tripId: string
  dayPlan: DayPlan | undefined
  isTagOver: boolean
  onDayPlanChange: (dateKey: string, updated: DayPlan) => void
}) {
  const dateKey = toDateKey(date)
  const allDayTag = getTagById(dayPlan?.label)
  const items = (dayPlan?.items ?? []).map(decodeItem)

  // Group items by hour. Items without a specific time go to 'untimed'
  const itemsByHour: Record<number, DayPlanItem[]> = {}
  const untimedItems: DayPlanItem[] = []

  items.forEach(item => {
    if (item.time) {
      const hour = parseInt(item.time.split(':')[0], 10)
      if (!isNaN(hour)) {
        if (!itemsByHour[hour]) itemsByHour[hour] = []
        itemsByHour[hour].push(item)
      } else {
        untimedItems.push(item)
      }
    } else {
      untimedItems.push(item)
    }
  })

  // We reuse the basic column for untimed items to avoid duplicating all the logic
  return (
    <div className="flex gap-4 min-w-max h-full">
      {/* Time column */}
      <div className="w-[340px] flex-shrink-0 flex flex-col rounded-xl border border-gray-200 bg-white">
        <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <p className="text-sm font-semibold text-gray-700">Schedule - {formatColumnDate(date)}</p>
          {allDayTag && (
            <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-gray-100 w-fit">
              <span className="text-sm">{allDayTag.icon}</span>
              <span className="text-xs font-medium text-gray-600">{allDayTag.label} (All Day)</span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {HOURS.map(hour => {
            const slotItems = itemsByHour[hour] || []
            const timeStr = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            return (
              <TimeSlot
                key={hour}
                dateKey={dateKey}
                hour={hour}
                timeStr={timeStr}
                items={slotItems}
                tripId={tripId}
                dayPlan={dayPlan}
                onDayPlanChange={onDayPlanChange}
              />
            )
          })}
        </div>
      </div>

      {/* Untimed Items Column */}
      <div className="flex flex-col">
        <div className="mb-2 pl-1">
          <p className="text-sm font-semibold text-indigo-900 bg-indigo-100 rounded px-2 py-0.5 inline-block w-fit">Untimed Items</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5 ml-1">Drop here or add items for packing.</p>
        </div>
        <DayColumn
          date={date}
          dayIndex={dayIndex}
          tripId={tripId}
          dayPlan={{
            ...(dayPlan ?? { id: `pending-${dateKey}`, tripId, date: dateKey as unknown as Date, items: [] }),
            items: untimedItems
          }}
          isTagOver={isTagOver}
          onDayPlanChange={(dk, updated) => {
            // Re-merge with timed items
            const newTimed = items.filter(i => i.time && !isNaN(parseInt(i.time.split(':')[0], 10)))
            onDayPlanChange(dk, { ...updated, items: [...newTimed, ...updated.items] })
          }}
        />
      </div>
    </div>
  )
}

function TimeSlot({
  dateKey,
  hour,
  timeStr,
  items,
  tripId,
  dayPlan,
  onDayPlanChange,
}: {
  dateKey: string
  hour: number
  timeStr: string
  items: DayPlanItem[]
  tripId: string
  dayPlan: DayPlan | undefined
  onDayPlanChange: (dateKey: string, updated: DayPlan) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: makeTimeSlotDropId(dateKey, hour) })
  const [, startTransition] = useTransition()

  function handleDeleteItem(itemId: string) {
    if (!dayPlan) return
    onDayPlanChange(dateKey, { ...dayPlan, items: dayPlan.items.filter((i) => i.id !== itemId) })
    startTransition(async () => { await apiDeleteDayPlanItem(itemId) })
  }

  function handleTimeChange(itemId: string, time: string | null) {
    if (!dayPlan) return
    const updated = dayPlan.items.map((i) => i.id === itemId ? { ...i, notes: time } : i)
    const sorted = applyTimeSort(updated)
    onDayPlanChange(dateKey, { ...dayPlan, items: sorted })
    startTransition(async () => {
      await apiUpdateDayPlanItemNotes(itemId, time)
      await apiReorderDayPlanItems(dayPlan.id, sorted.map((i) => i.id))
    })
  }

  return (
    <div ref={setNodeRef} className="flex min-h-[60px] border-b border-gray-100 last:border-0 group">
      <div className="w-16 flex-shrink-0 border-r border-gray-100 flex justify-end pr-2 pt-2">
        <span className="text-[10px] text-gray-400 font-medium">{timeStr}</span>
      </div>
      <div className={`flex-1 p-2 ${isOver ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-200' : ''}`}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {items.map(item => (
              item.itemType === 'tag' ? (
                <InlineTagCard key={item.id} item={item} onDelete={handleDeleteItem} onTimeChange={handleTimeChange} />
              ) : (
                <DraggableCard key={item.id} item={item} onDelete={handleDeleteItem} />
              )
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

// ─── PlanningBoardView ────────────────────────────────────────────────────────

export default function PlanningBoardView({ trip, onUnsyncedItemsChange }: PlanningBoardViewProps) {
  const days = generateDays(trip.startDate, trip.endDate)
  const [dayPlans, setDayPlans] = useState<DayPlanMap>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tagOverColumn, setTagOverColumn] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState<Date>(days[0] || new Date())
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!onUnsyncedItemsChange) return

    const allPlanItems = Object.values(dayPlans).flatMap(dp => dp.items || [])
    const packingItems = trip.packingLists?.flatMap((list: any) => list.categories.flatMap((cat: any) => cat.items)) || []

    const unsyncedItems = allPlanItems
      .filter(planItem => {
        if (planItem.category === TAG_CATEGORY) return false
        return !packingItems.some((pi: any) => pi.name.toLowerCase() === planItem.name.toLowerCase())
      })
      .map(item => item.name)

    const uniqueUnsynced = Array.from(new Set(unsyncedItems))

    onUnsyncedItemsChange(uniqueUnsynced)
  }, [dayPlans, trip.packingLists, onUnsyncedItemsChange])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/day-plans/${trip.id}`)
        if (!res.ok) return
        const data = await res.json()
        const map: DayPlanMap = {}
        for (const dp of data.dayPlans ?? []) {
          const key = new Date(dp.date).toISOString().split('T')[0]
          // Apply time sort once on initial load so persisted order is correct
          map[key] = { ...(dp as DayPlan), items: applyTimeSort((dp as DayPlan).items ?? []) }
        }
        setDayPlans(map)
      } catch (e) { console.error('Failed to load day plans', e) }
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

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    const tagId = parseTagDragId(active.id as string)
    if (!tagId) { setTagOverColumn(null); return }
    let colKey: string | null = null
    if (over) {
      colKey = parseColDropId(over.id as string)
      if (!colKey) {
        const slotMatch = parseTimeSlotDropId(over.id as string)
        if (slotMatch) colKey = slotMatch.dateKey
      }
      if (!colKey) colKey = findColumnKeyForItem(over.id as string)
    }
    setTagOverColumn(colKey)
  }

  function getOrSeedPlan(dateKey: string): DayPlan {
    return dayPlans[dateKey] ?? {
      id: `pending-${dateKey}`,
      tripId: trip.id,
      date: dateKey as unknown as Date,
      label: null,
      items: [],
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    setTagOverColumn(null)
    const { active, over } = event
    if (!over) return

    const tagId = parseTagDragId(active.id as string)

    if (tagId) {
      const tag = getTagById(tagId)
      if (!tag) return

      const dateKey = parseColDropId(over.id as string)
      const slotMatch = parseTimeSlotDropId(over.id as string)

      if (dateKey) {
        setDayPlans((prev) => {
          const existing = prev[dateKey]
          if (existing) return { ...prev, [dateKey]: { ...existing, label: tag.label } }
          return { ...prev, [dateKey]: { id: `pending-${dateKey}`, tripId: trip.id, date: dateKey as unknown as Date, label: tag.label, items: [] } }
        })
        startTransition(async () => {
          const result = await apiUpsertDayPlan(trip.id, dateKey, tag.label)
          if (result.dayPlan) handleDayPlanChange(dateKey, result.dayPlan)
        })
        return
      }

      const overItemKey = findColumnKeyForItem(over.id as string)

      if (slotMatch || !overItemKey) {
        if (!tagOverColumn && !slotMatch) return
        const fallbackKey = slotMatch ? slotMatch.dateKey : tagOverColumn!
        const initialTime = slotMatch ? `${slotMatch.hour.toString().padStart(2, '0')}:00` : undefined
        const plan = getOrSeedPlan(fallbackKey)
        const encoded = encodeTagItem(tag.id, initialTime)
        const tempId = `temp-tag-${Date.now()}`
        const newItem: DayPlanItem = { id: tempId, dayPlanId: plan.id, order: plan.items.length, ...encoded }
        const withNew = { ...plan, items: [...plan.items, newItem] }
        setDayPlans((prev) => ({ ...prev, [fallbackKey]: withNew }))
        startTransition(async () => {
          let realPlan = dayPlans[fallbackKey]
          if (!realPlan || realPlan.id.startsWith('pending-')) {
            const r = await apiUpsertDayPlan(trip.id, fallbackKey)
            if (!r.dayPlan) return
            realPlan = r.dayPlan
            handleDayPlanChange(fallbackKey, realPlan)
          }
          const result = await apiAddDayPlanItem(realPlan.id, encoded)
          if (result.item) {
            setDayPlans((prev) => {
              const p = prev[fallbackKey]
              if (!p) return prev
              return { ...prev, [fallbackKey]: { ...p, items: p.items.map((i) => i.id === tempId ? result.item : i) } }
            })
          }
        })
        return
      }

      const overPlan = dayPlans[overItemKey]
      const overIndex = overPlan.items.findIndex((i) => i.id === over.id)
      const insertIndex = overIndex >= 0 ? overIndex : overPlan.items.length
      const encoded = encodeTagItem(tag.id)
      const tempId = `temp-tag-${Date.now()}`
      const newTagItem: DayPlanItem = { id: tempId, dayPlanId: overPlan.id, order: insertIndex, ...encoded }
      const newItems = [
        ...overPlan.items.slice(0, insertIndex),
        newTagItem,
        ...overPlan.items.slice(insertIndex),
      ].map((item, idx) => ({ ...item, order: idx }))

      setDayPlans((prev) => ({ ...prev, [overItemKey]: { ...overPlan, items: newItems } }))
      startTransition(async () => {
        const result = await apiAddDayPlanItem(overPlan.id, encoded)
        if (result.item) {
          setDayPlans((prev) => {
            const plan = prev[overItemKey]
            if (!plan) return prev
            return { ...prev, [overItemKey]: { ...plan, items: plan.items.map((i) => i.id === tempId ? result.item : i) } }
          })
          const finalIds = newItems.map((i) => i.id === tempId ? result.item.id : i.id)
          await apiReorderDayPlanItems(overPlan.id, finalIds)
        }
      })
      return
    }

    if (active.id === over.id) return

    // Regular item reorder / cross-column move / time assignment
    const sourceKey = findColumnKeyForItem(active.id as string)
    let destKey = findColumnKeyForItem(over.id as string)
    const slotMatch = parseTimeSlotDropId(over.id as string)

    if (slotMatch) destKey = slotMatch.dateKey
    if (!sourceKey) return

    const sourcePlan = dayPlans[sourceKey]
    const movingItem = sourcePlan.items.find((i) => i.id === active.id)
    if (!movingItem) return

    if (slotMatch) {
      // Assign specific time to an item
      const newTime = `${slotMatch.hour.toString().padStart(2, '0')}:00`
      const isCrossDay = sourceKey !== destKey
      const targetKey = isCrossDay ? destKey! : sourceKey
      const targetPlan = dayPlans[targetKey] || getOrSeedPlan(targetKey)

      const updatedItem = { ...movingItem, notes: newTime }

      if (isCrossDay) {
        const newOrder = targetPlan.items.length
        setDayPlans((prev) => ({
          ...prev,
          [sourceKey]: { ...sourcePlan, items: sourcePlan.items.filter((i) => i.id !== active.id) },
          [targetKey]: { ...targetPlan, items: [...targetPlan.items, { ...updatedItem, dayPlanId: targetPlan.id, order: newOrder }] },
        }))
        startTransition(async () => {
          await apiUpdateDayPlanItemNotes(active.id as string, newTime)
          await apiMoveDayPlanItem(active.id as string, targetPlan.id, newOrder)
        })
      } else {
        const updatedItems = sourcePlan.items.map(i => i.id === active.id ? updatedItem : i)
        const sorted = applyTimeSort(updatedItems)
        setDayPlans((prev) => ({ ...prev, [sourceKey]: { ...sourcePlan, items: sorted } }))
        startTransition(async () => {
          await apiUpdateDayPlanItemNotes(active.id as string, newTime)
          await apiReorderDayPlanItems(sourcePlan.id, sorted.map((i) => i.id))
        })
      }
      return
    }

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

  const activeTag = activeId ? getTagById(parseTagDragId(activeId)) : null
  const allItems = Object.values(dayPlans).flatMap((dp) => dp.items.map(decodeItem))
  const activeItem = activeId && !activeTag ? allItems.find((i) => i.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Day View
          </button>
        </div>

        {viewMode === 'day' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idx = days.findIndex(d => toDateKey(d) === toDateKey(selectedDay))
                if (idx > 0) setSelectedDay(days[idx - 1])
              }}
              disabled={toDateKey(selectedDay) === toDateKey(days[0])}
              className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <select
              value={toDateKey(selectedDay)}
              onChange={(e) => {
                const day = days.find(d => toDateKey(d) === e.target.value)
                if (day) setSelectedDay(day)
              }}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {days.map((d, i) => (
                <option key={toDateKey(d)} value={toDateKey(d)}>
                  Day {i + 1} - {formatColumnDate(d)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const idx = days.findIndex(d => toDateKey(d) === toDateKey(selectedDay))
                if (idx < days.length - 1) setSelectedDay(days[idx + 1])
              }}
              disabled={toDateKey(selectedDay) === toDateKey(days[days.length - 1])}
              className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-5">
        <div className="w-40 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Day Tags</p>
            <p className="text-[10px] text-gray-300 mb-1 leading-tight">Drop on <strong>header</strong> = all day</p>
            <p className="text-[10px] text-gray-300 mb-3 leading-tight">Drop on <strong>item</strong> = inline event</p>
            {viewMode === 'day' && <p className="text-[10px] text-blue-400 mb-3 leading-tight">Drop on <strong>time</strong> = timed event</p>}
            <div className="space-y-1.5">
              {DAY_TAGS.map((tag) => (
                <DraggableTagChip key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className={`flex gap-4 pb-4 h-full ${viewMode === 'week' ? 'flex-col' : 'flex-row'}`}>
            {viewMode === 'week' ? (
              days.map((date, index) => {
                const key = toDateKey(date)
                return (
                  <div key={key} className="w-full">
                    <DayColumn
                      date={date}
                      dayIndex={index}
                      tripId={trip.id}
                      dayPlan={dayPlans[key]}
                      isTagOver={tagOverColumn === key}
                      onDayPlanChange={handleDayPlanChange}
                    />
                  </div>
                )
              })
            ) : (
              <div className="w-full max-w-xl">
                <DayDetailView
                  date={selectedDay}
                  dayIndex={days.findIndex(d => toDateKey(d) === toDateKey(selectedDay))}
                  tripId={trip.id}
                  dayPlan={dayPlans[toDateKey(selectedDay)]}
                  isTagOver={tagOverColumn === toDateKey(selectedDay)}
                  onDayPlanChange={handleDayPlanChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTag ? (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg cursor-grabbing ${activeTag.colors.chip}`}>
            <span className="text-base">{activeTag.icon}</span>
            <span className="text-xs font-semibold">{activeTag.label}</span>
          </div>
        ) : activeItem?.itemType === 'tag' ? (
          <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg shadow-lg border border-dashed w-[240px] cursor-grabbing ${
            getTagById(activeItem.tagId ?? null)?.colors.inlineBg ?? 'bg-gray-50'
          }`}>
            <span>{getTagById(activeItem.tagId ?? null)?.icon ?? '📍'}</span>
            <span className="text-xs font-semibold">{getTagById(activeItem.tagId ?? null)?.label ?? activeItem.name}</span>
          </div>
        ) : activeItem ? (
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg w-[240px] cursor-grabbing">
            <span className="text-xs font-medium text-gray-800">{activeItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
