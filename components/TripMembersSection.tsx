'use client'

import { useState, useTransition } from 'react'
import { addTripMember, removeTripMember } from '@/actions/trip-member.actions'
import { Users, Plus, X, Check } from 'lucide-react'
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
    <div className="flex flex-col gap-2">
      {/* Single inline row: icon + label + member pills + add button */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 shrink-0">
          <Users className="w-3.5 h-3.5" />
          Members
        </span>

        {members.map(member => (
          <span
            key={member.id}
            className="group flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
          >
            <div className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[9px] font-bold">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-700">{member.name}</span>
            {isOwner && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 -mr-0.5"
                title="Remove member"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {members.length === 0 && !isAdding && (
          <span className="text-xs text-gray-300">No members yet</span>
        )}

        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {/* Compact inline add form */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name (e.g. Peter, Grandma)"
            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); setError(null) }
            }}
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            title="Confirm"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewName(''); setError(null) }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
