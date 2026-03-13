import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Save, X, Smartphone, Bell, Mail } from 'lucide-react'

interface TripTask {
  id?: string
  title: string
  notes: string | null
  category: string
  dueDate: string | null
  reminderAt: string | null
  reminderTypes: string[]
  status: string
}

interface TaskFormProps {
  initialTask?: TripTask | null
  onSave: (task: Partial<TripTask>) => void
  onCancel: () => void
  startDate: string | Date | null
}

const CATEGORIES = [
  'HEALTH', 'PETS', 'LOGISTICS', 'DOCUMENTS', 'HOME', 'OTHER'
]

export default function TaskForm({ initialTask, onSave, onCancel, startDate }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '')
  const [category, setCategory] = useState(initialTask?.category || 'LOGISTICS')
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate ? new Date(initialTask.dueDate).toISOString().slice(0, 16) : ''
  )
  const [reminderAt, setReminderAt] = useState(
    initialTask?.reminderAt ? new Date(initialTask.reminderAt).toISOString().slice(0, 16) : ''
  )
  const [notes, setNotes] = useState(initialTask?.notes || '')

  // Default to just PUSH if not editing an existing task
  const [reminderTypes, setReminderTypes] = useState<string[]>(
    initialTask?.reminderTypes || ['PUSH']
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    onSave({
      ...(initialTask?.id ? { id: initialTask.id } : {}),
      title: title.trim(),
      category,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
      notes: notes.trim() || null,
      reminderTypes,
      status: initialTask?.status || 'PENDING'
    })
  }

  const toggleReminderType = (type: string) => {
    setReminderTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          {initialTask ? 'Edit Task' : 'New Task'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Renew passport"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Reminders: Coming soon! */}
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Reminders</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 text-blue-700 rounded-full ml-auto">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-gray-400">
            SMS, Push, and Calendar notifications are currently disabled and will be available in a future update.
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            placeholder="Add details like numbers, addresses, etc."
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save Task
        </button>
      </div>
    </form>
  )
}
