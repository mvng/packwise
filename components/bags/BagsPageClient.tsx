'use client'

import { useState, useTransition } from 'react'
import { createBag, updateBag, deleteBag } from '@/actions/bags.actions'

const BAG_TYPES = [
  { value: 'backpack', label: 'Backpack', emoji: '🎒' },
  { value: 'carry-on', label: 'Carry-on', emoji: '🧳' },
  { value: 'check-in', label: 'Check-in', emoji: '🧳' },
  { value: 'duffel', label: 'Duffel', emoji: '👜' },
  { value: 'tote', label: 'Tote', emoji: '🛍️' },
  { value: 'personal', label: 'Personal item', emoji: '👝' },
  { value: 'trunk', label: 'Trunk', emoji: '🧳' },
  { value: 'other', label: 'Other', emoji: '🗃️' },
]

const getBagEmoji = (type: string) =>
  BAG_TYPES.find((t) => t.value === type)?.emoji ?? '🧳'

const getBagLabel = (type: string) =>
  BAG_TYPES.find((t) => t.value === type)?.label ?? type

interface Bag {
  id: string
  name: string
  type: string
  capacity: string | null
  color: string | null
  notes: string | null
  tripBags: { id: string; tripId: string }[]
}

const emptyForm = { name: '', type: 'other', capacity: '', color: '', notes: '' }

export default function BagsPageClient({ initialBags }: { initialBags: Bag[] }) {
  const [bags, setBags] = useState<Bag[]>(initialBags)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setError(null)
    const result = await createBag(form)
    if (result.error) { setError(result.error); return }
    if (result.bag) setBags((prev) => [...prev, { ...result.bag!, tripBags: [] }])
    setForm(emptyForm)
    setAdding(false)
  }

  const handleUpdate = async (bagId: string) => {
    if (!editForm.name.trim()) return
    setError(null)
    const result = await updateBag(bagId, editForm)
    if (result.error) { setError(result.error); return }
    if (result.bag) {
      setBags((prev) => prev.map((b) => b.id === bagId ? { ...b, ...result.bag! } : b))
    }
    setEditingId(null)
  }

  const handleDelete = (bagId: string) => {
    startTransition(async () => {
      setError(null)
      const result = await deleteBag(bagId)
      if (result.error) { setError(result.error); return }
      setBags((prev) => prev.filter((b) => b.id !== bagId))
    })
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="text-sm px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          + Add Bag
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">New Bag</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input
                type="text"
                placeholder="e.g. Aer Travel Pack 3, Rimowa Essential"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {BAG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Capacity (optional)</label>
              <input
                type="text"
                placeholder="e.g. 20L, 26\" spinner"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Color (optional)</label>
              <input
                type="text"
                placeholder="e.g. Black, Olive"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
              <input
                type="text"
                placeholder="Any notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setForm(emptyForm) }}
              className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {bags.length === 0 && !adding && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🧳</div>
          <h3 className="font-semibold text-gray-900 mb-2">No bags yet</h3>
          <p className="text-gray-500 text-sm">
            Add the bags you own and bring them to specific trips to organize what goes where.
          </p>
        </div>
      )}

      {/* Bag cards */}
      {bags.map((bag) => (
        <div key={bag.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {editingId === bag.id ? (
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {BAG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
                  <input
                    type="text"
                    value={editForm.capacity}
                    onChange={(e) => setEditForm((p) => ({ ...p, capacity: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Color</label>
                  <input
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(bag.id)}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 flex items-center gap-4">
              <div className="text-3xl flex-shrink-0">{getBagEmoji(bag.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{bag.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {getBagLabel(bag.type)}
                  </span>
                  {bag.capacity && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {bag.capacity}
                    </span>
                  )}
                  {bag.color && (
                    <span className="text-xs text-gray-400">{bag.color}</span>
                  )}
                </div>
                {bag.notes && (
                  <p className="text-xs text-gray-400 mt-0.5">{bag.notes}</p>
                )}
                {bag.tripBags.length > 0 && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    Used on {bag.tripBags.length} trip{bag.tripBags.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingId(bag.id)
                    setEditForm({
                      name: bag.name,
                      type: bag.type,
                      capacity: bag.capacity ?? '',
                      color: bag.color ?? '',
                      notes: bag.notes ?? '',
                    })
                  }}
                  className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bag.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
