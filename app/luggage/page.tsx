'use client'

import { useState, useEffect } from 'react'
import { getUserLuggage, createLuggage, deleteLuggage } from '@/actions/luggage.actions'
import type { Luggage, LuggageType } from '@/types/luggage'
import Link from 'next/link'

export default function LuggagePage() {
  const [luggage, setLuggage] = useState<Luggage[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'backpack' as LuggageType, capacity: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLuggage()
  }, [])

  async function loadLuggage() {
    setLoading(true)
    const result = await getUserLuggage()
    if (result.luggage) {
      setLuggage(result.luggage as Luggage[])
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!formData.name.trim()) return

    const result = await createLuggage({
      name: formData.name,
      type: formData.type,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
    })

    if (result.success) {
      setFormData({ name: '', type: 'backpack', capacity: '' })
      setShowForm(false)
      loadLuggage()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this luggage?')) return
    await deleteLuggage(id)
    loadLuggage()
  }

  const luggageIcons: Record<LuggageType, string> = {
    backpack: '🎒',
    'carry-on': '🧳',
    checked: '💼',
    trunk: '📦',
    other: '👜',
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Luggage</h1>
            <p className="text-gray-600 mt-1">Manage your bags and luggage</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Luggage
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Luggage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 20L Aer Pro Pack"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as LuggageType })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="backpack">Backpack</option>
                  <option value="carry-on">Carry-on</option>
                  <option value="checked">Checked</option>
                  <option value="trunk">Trunk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Liters)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 20"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {luggage.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🧳</div>
            <h3 className="font-semibold text-gray-900 mb-2">No luggage yet</h3>
            <p className="text-gray-500 text-sm">Add your bags to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {luggage.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{luggageIcons[item.type as LuggageType]}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                      {item.capacity && (
                        <p className="text-xs text-gray-400 mt-1">{item.capacity}L capacity</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/luggage/${item.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View History
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
