'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, Loader2 } from 'lucide-react'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import SmartSuggestions from './SmartSuggestions'

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

interface TripPlanningAssistantProps {
  tripId: string
  startDate: string | Date | null
}

export default function TripPlanningAssistant({ tripId, startDate }: TripPlanningAssistantProps) {
  const [tasks, setTasks] = useState<TripTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTask, setEditingTask] = useState<TripTask | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/trips/${tripId}/tasks`)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleSaveTask = async (taskData: Partial<TripTask>) => {
    try {
      const isNew = !taskData.id
      const method = isNew ? 'POST' : 'PATCH'
      const url = isNew
        ? `/api/trips/${tripId}/tasks`
        : `/api/trips/${tripId}/tasks/${taskData.id}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!res.ok) throw new Error('Failed to save task')

      const { task } = await res.json()

      if (isNew) {
        setTasks(prev => [...prev, task])
      } else {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t))
      }

      setIsEditing(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const res = await fetch(`/api/trips/${tripId}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete task')

      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE'

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    try {
      const res = await fetch(`/api/trips/${tripId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert on failure
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: currentStatus } : t
      ))
    }
  }

  const handleApplySuggestion = (suggestion: { title: string, category: string, daysBefore: number }) => {
    let dueDateStr = ''
    let reminderStr = ''

    if (startDate) {
      const tripDate = new Date(startDate)

      const suggestedDueDate = new Date(tripDate)
      suggestedDueDate.setDate(tripDate.getDate() - suggestion.daysBefore)

      if (suggestedDueDate > new Date()) {
        dueDateStr = suggestedDueDate.toISOString().slice(0, 16)

        const suggestedReminderAt = new Date(suggestedDueDate)
        suggestedReminderAt.setDate(suggestedReminderAt.getDate() - 1)
        suggestedReminderAt.setHours(9, 0, 0, 0)

        // Reminders coming soon: statically set to empty
        reminderStr = ''
      }
    }

    setEditingTask({
      id: '',
      title: suggestion.title,
      category: suggestion.category,
      notes: '',
      dueDate: dueDateStr || null,
      reminderAt: null,
      reminderTypes: [],
      status: 'PENDING'
    } as TripTask)
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const pendingTasks = tasks.filter(t => t.status !== 'DONE')
  const doneTasks = tasks.filter(t => t.status === 'DONE')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[500px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pre-Trip Planning</h2>
          <p className="text-gray-500 text-sm mt-1">Manage tasks and reminders before you go</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setEditingTask(null)
              setIsEditing(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {!isEditing && pendingTasks.length === 0 && tasks.length === 0 && (
        <SmartSuggestions startDate={startDate} onSelect={handleApplySuggestion} />
      )}

      {isEditing && (
        <TaskForm
          initialTask={editingTask}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsEditing(false)
            setEditingTask(null)
          }}
          startDate={startDate}
        />
      )}

      {!isEditing && tasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 mb-4">No tasks yet. Add a task to get started!</p>
          <button
            onClick={() => {
              setEditingTask(null)
              setIsEditing(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Task
          </button>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-8">
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                To Do
                <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {pendingTasks.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteTask}
                    onEdit={(t) => {
                      setEditingTask(t)
                      setIsEditing(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                Completed
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {doneTasks.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doneTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteTask}
                    onEdit={(t) => {
                      setEditingTask(t)
                      setIsEditing(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
