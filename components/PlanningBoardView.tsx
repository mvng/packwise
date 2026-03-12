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
  trip: { id: string; startDate: Date | string; endDate: Date | string }
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
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            onBlur={commitTime}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTime() }}
            className="ml-2 text-[11px] bg-white border border-current/20 rounded px-1 py-0.5 focus:outline-none w-24"
          />
        ) : (
          <button
            onClick={() => setEditingTime(true)}
            className="ml-2 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
          >
            {item.time ? fmtTime(item.time) : <span className="italic">+ time</span>}
          </button>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
        className="opacity-0 group-hover:opacity-100 text-current/40 hover:text-red-400 transition-opacity text-sm leading-none flex-shrink-0"
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
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity text-sm leading-none flex-shrink-0 focus:outline-none rounded ml-1"
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
    setName(''); setCategory('Outfit'); setQuantity(1); setNotes('')
    setOpen(false)
  }

  const inputCls = 'text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bg-white'

  if (!open) return (
    <div className="flex items-center gap-3 pt-1">
      <button onClick={() => setOpen(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">+ Add item</button>
      <button onClick={onOpenInventory} className="text-xs text-gray-400 hover:text-blue-500 transition-colors">+ Inventory</button>
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
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
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
              <button onClick={() => saveLabel('')} className={`ml-auto text-[11px] opacity-60 hover:opacity-100 ${headerText} focus:outline-none leading-none`}>✕</button>
            </div>
          ) : editingLabel ? (
            <input autoFocus type="text" value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={() => saveLabel(labelInput)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(labelInput) }}
              className="mt-1 text-[11px] w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button onClick={() => setEditingLabel(true)} className="mt-0.5 focus:outline-none rounded w-full text-left">
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
                  : <button onClick={handleSaveToInventory} className="text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition-colors">↓ Save to inventory</button>
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

// ─── PlanningBoardView ────────────────────────────────────────────────────────

export default function PlanningBoardView({ trip }: PlanningBoardViewProps) {
  const days = generateDays(trip.startDate, trip.endDate)
  const [dayPlans, setDayPlans] = useState<DayPlanMap>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [tagOverColumn, setTagOverColumn] = useState<string | null>(null)
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

      if (!overItemKey) {
        if (!tagOverColumn) return
        const fallbackKey = tagOverColumn
        const plan = getOrSeedPlan(fallbackKey)
        const encoded = encodeTagItem(tag.id)
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

    // Regular item reorder / cross-column move
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
      <div className="flex gap-5">
        <div className="w-40 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sticky top-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Day Tags</p>
            <p className="text-[10px] text-gray-300 mb-1 leading-tight">Drop on <strong>header</strong> = all day</p>
            <p className="text-[10px] text-gray-300 mb-3 leading-tight">Drop on <strong>item</strong> = inline event</p>
            <div className="space-y-1.5">
              {DAY_TAGS.map((tag) => (
                <DraggableTagChip key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div className="inline-flex gap-3 pb-4 min-w-max">
            {days.map((date, index) => {
              const key = toDateKey(date)
              return (
                <DayColumn
                  key={key}
                  date={date}
                  dayIndex={index}
                  tripId={trip.id}
                  dayPlan={dayPlans[key]}
                  isTagOver={tagOverColumn === key}
                  onDayPlanChange={handleDayPlanChange}
                />
              )
            })}
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
