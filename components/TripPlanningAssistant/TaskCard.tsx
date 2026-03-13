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
      className={`relative p-4 rounded-xl border transition-all ${
        isDone ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleStatus(task.id, task.status)}
          className={`mt-1 flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors ${
            isDone ? 'text-green-500 hover:text-green-600' : ''
          }`}
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

            {task.reminderAt && (
              <div className="flex items-center gap-1 text-blue-600">
                <Bell className="w-3.5 h-3.5" />
                <span>Reminder: {formatDate(task.reminderAt)}</span>

                <div className="flex items-center gap-0.5 ml-1">
                  {task.reminderTypes.includes('PUSH') && <Bell className="w-3 h-3" />}
                  {task.reminderTypes.includes('SMS') && <Smartphone className="w-3 h-3" />}
                  {task.reminderTypes.includes('CALENDAR') && <CalendarIcon className="w-3 h-3" />}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
