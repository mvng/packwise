import { useState } from 'react'
import { Calendar, Trash2, Edit2, Bell, CheckCircle, Circle, Smartphone, Mail, Calendar as CalendarIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TripTask {
  id: string
  title: string
  notes: string | null
  category: string
  dueDate: string | null
  reminderAt: string | null
  reminderTypes: string[]
  status: string
}

interface TaskCardProps {
  task: TripTask
  onToggleStatus: (taskId: string, currentStatus: string) => void
  onDelete: (taskId: string) => void
  onEdit: (task: TripTask) => void
}

export default function TaskCard({ task, onToggleStatus, onDelete, onEdit }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isDone = task.status === 'DONE'

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all ${
        isDone ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleStatus(task.id, task.status)}
          className={`mt-1 flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full ${
            isDone ? 'text-green-500 hover:text-green-600' : ''
          }`}
          aria-label={isDone ? 'Mark task as not done' : 'Mark task as done'}
        >
          {isDone ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium truncate ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h4>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
              {task.category}
            </span>
          </div>

          {task.notes && (
            <p className={`text-sm mt-1 mb-2 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.notes}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            )}

            {/* task.reminderAt block has been removed - Reminders: Coming soon! */}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Edit task"
            aria-label={`Edit task ${task.title}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Delete task"
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
