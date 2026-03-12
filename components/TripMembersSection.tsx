'use client'

import { useState, useTransition } from 'react'
import { addTripMember, removeTripMember } from '@/actions/trip-member.actions'
import { Users, Plus, X } from 'lucide-react'
import type { TripMember } from '@/components/PackingListSection'

interface TripMembersSectionProps {
  tripId: string
  members: TripMember[]
  isOwner: boolean
}

export default function TripMembersSection({ tripId, members: initialMembers, isOwner }: TripMembersSectionProps) {
  const [members, setMembers] = useState(initialMembers || [])
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    setError(null)

    startTransition(async () => {
      const res = await addTripMember(tripId, newName.trim())
      if (res.error) {
        setError(res.error)
      } else if (res.member) {
        setMembers(prev => [...prev, res.member])
        setNewName('')
        setIsAdding(false)
      }
    })
  }

  const handleRemove = (memberId: string) => {
    if (!confirm('Remove this member? Any items assigned to them will be unassigned.')) return

    startTransition(async () => {
      const res = await removeTripMember(tripId, memberId)
      if (res.error) {
        setError(res.error)
      } else {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Trip Members
        </h3>
        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add member
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
      )}

      {isAdding && (
        <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name (e.g. Peter, Grandma)"
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewName(''); setError(null); }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {members.length === 0 && !isAdding ? (
        <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl text-center">
          No members yet. Add people to assign them packing tasks.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {members.map(member => (
            <li key={member.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center text-xs font-bold shadow-inner">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{member.name}</span>
              {isOwner && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50 ml-1"
                  title="Remove member"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
