'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addTripMember(tripId: string, name: string) {
  try {
    const member = await prisma.tripMember.create({
      data: {
        tripId,
        name,
      },
    })
    revalidatePath(`/trip/${tripId}`)
    return { member }
  } catch (error) {
    console.error('Failed to add trip member:', error)
    return { error: 'Failed to add member to the trip' }
  }
}

export async function removeTripMember(tripId: string, memberId: string) {
  try {
    await prisma.tripMember.deleteMany({
      where: {
        id: memberId,
        tripId: tripId,
      },
    })
    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to remove trip member:', error)
    return { error: 'Failed to remove member from the trip' }
  }
}

export async function updateTripMember(tripId: string, memberId: string, name: string) {
  try {
    const member = await prisma.tripMember.updateMany({
      where: {
        id: memberId,
        tripId: tripId,
      },
      data: {
        name,
      },
    })
    revalidatePath(`/trip/${tripId}`)
    return { member }
  } catch (error) {
    console.error('Failed to update trip member:', error)
    return { error: 'Failed to update member name' }
  }
}
