'use client'

import { useState, useRef, useEffect } from 'react'
import type { ItemFormData } from '@/types/inventory'

interface AddItemModalProps {
  mode: 'add' | 'edit'
  initialValues?: ItemFormData
  onClose: () => void
  onSubmit: (data: ItemFormData) => void
  isPending: boolean
}

export default function AddItemModal({
  mode,
  initialValues,
  onClose,
  onSubmit,
  isPending,
}: AddItemModalProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? 1)
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), quantity, notes: notes.trim() })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="font-semibold text-gray-900 mb-4">
          {mode === 'edit' ? 'Edit Item' : 'Add Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Item name</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Rain jacket"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Notes <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Packed in blue duffel"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
            >
              {isPending ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
