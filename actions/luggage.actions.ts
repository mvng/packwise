'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { CreateLuggageInput, UpdateLuggageInput } from '@/types/luggage'

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user.id
  } catch {}

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
  } catch {}

  const cookieStore = await cookies()
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}

async function ensureUserExists(userId: string): Promise<string> {
  // Check if user exists by supabaseId (the unique constraint field)
  const existingUser = await prisma.user.findUnique({ 
    where: { supabaseId: userId } 
  })
  
  if (existingUser) {
    // Return the actual user.id from database
    return existingUser.id
  }

  // Create user if doesn't exist (for guest mode or new auth users)
  const newUser = await prisma.user.create({
    data: {
      email: `guest-${userId.slice(0, 8)}@packwise.app`,
      name: 'Guest User',
      supabaseId: userId,
    },
  })
  
  return newUser.id
}

export async function getUserLuggage() {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    // Get the actual database user ID
    const dbUserId = await ensureUserExists(supabaseUserId)

    const luggage = await prisma.luggage.findMany({
      where: { userId: dbUserId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, luggage }
  } catch (error) {
    return { error: 'Failed to fetch luggage' }
  }
}

export async function createLuggage(input: CreateLuggageInput) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    // Ensure user exists and get the database user ID
    const dbUserId = await ensureUserExists(supabaseUserId)

    const luggage = await prisma.luggage.create({
      data: {
        userId: dbUserId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        capacity: input.capacity,
      },
    })

    revalidatePath('/luggage')
    return { success: true, luggage }
  } catch (error) {
    console.error('Failed to create luggage:', error)
    return { error: 'Failed to create luggage' }
  }
}

export async function updateLuggage(id: string, input: UpdateLuggageInput) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    const dbUserId = await ensureUserExists(supabaseUserId)

    const luggage = await prisma.luggage.findUnique({ where: { id } })
    if (!luggage || luggage.userId !== dbUserId) {
      return { error: 'Luggage not found' }
    }

    const updated = await prisma.luggage.update({
      where: { id },
      data: input,
    })

    revalidatePath('/luggage')
    return { success: true, luggage: updated }
  } catch (error) {
    return { error: 'Failed to update luggage' }
  }
}

export async function deleteLuggage(id: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    const dbUserId = await ensureUserExists(supabaseUserId)

    const luggage = await prisma.luggage.findUnique({ where: { id } })
    if (!luggage || luggage.userId !== dbUserId) {
      return { error: 'Luggage not found' }
    }

    await prisma.luggage.delete({ where: { id } })

    revalidatePath('/luggage')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete luggage' }
  }
}

export async function getTripLuggage(tripId: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    const tripLuggages = await prisma.tripLuggage.findMany({
      where: { tripId, isActive: true },
      include: {
        luggage: true,
        packingItems: true,
      },
    })

    return { success: true, tripLuggages }
  } catch (error) {
    return { error: 'Failed to fetch trip luggage' }
  }
}

export async function addLuggageToTrip(tripId: string, luggageId: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    const existing = await prisma.tripLuggage.findUnique({
      where: { tripId_luggageId: { tripId, luggageId } },
    })

    if (existing) {
      const updated = await prisma.tripLuggage.update({
        where: { id: existing.id },
        data: { isActive: true },
        include: { luggage: true },
      })
      revalidatePath(`/trip/${tripId}`)
      return { success: true, tripLuggage: updated }
    }

    const tripLuggage = await prisma.tripLuggage.create({
      data: { tripId, luggageId, isActive: true },
      include: { luggage: true },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true, tripLuggage }
  } catch (error) {
    return { error: 'Failed to add luggage to trip' }
  }
}

export async function addLuggagesToTrip(tripId: string, luggageIds: string[]) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    // Find which ones already exist
    const existing = await prisma.tripLuggage.findMany({
      where: {
        tripId,
        luggageId: { in: luggageIds },
      },
      select: { luggageId: true },
    })

    const existingIds = existing.map((e) => e.luggageId)
    const newIds = luggageIds.filter((id) => !existingIds.includes(id))

    if (existingIds.length > 0) {
      await prisma.tripLuggage.updateMany({
        where: {
          tripId,
          luggageId: { in: existingIds },
        },
        data: { isActive: true },
      })
    }

    if (newIds.length > 0) {
      await prisma.tripLuggage.createMany({
        data: newIds.map((luggageId) => ({
          tripId,
          luggageId,
          isActive: true,
        })),
        skipDuplicates: true,
      })
    }

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to add luggages to trip:', error)
    return { error: 'Failed to add luggages to trip' }
  }
}

export async function removeLuggageFromTrip(tripId: string, luggageId: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    await prisma.tripLuggage.updateMany({
      where: { tripId, luggageId },
      data: { isActive: false },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to remove luggage from trip' }
  }
}

export async function assignItemToLuggage(packingItemId: string, tripLuggageId: string | null, tripId?: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    await prisma.packingItem.update({
      where: { id: packingItemId },
      data: { tripLuggageId },
    })

    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to assign item to luggage' }
  }
}

export async function getLuggageHistory(luggageId: string) {
  try {
    const supabaseUserId = await getAuthenticatedUserId()
    if (!supabaseUserId) return { error: 'Unauthorized' }

    const dbUserId = await ensureUserExists(supabaseUserId)

    // Verify ownership
    const luggage = await prisma.luggage.findUnique({
      where: { id: luggageId },
      include: {
        user: {
          select: {
            homeCity: true,
            homeCountry: true
          }
        },
        tripLuggages: {
          where: { isActive: true },
          include: {
            trip: {
              select: {
                id: true,
                name: true,
                destination: true,
                startDate: true,
                endDate: true,
                tripType: true,
                transportMode: true,
              },
            },
            packingItems: {
              select: {
                id: true,
                name: true,
                quantity: true,
                isPacked: true,
              },
            },
          },
          orderBy: {
            trip: { startDate: 'desc' },
          },
        },
      },
    })

    if (!luggage || luggage.userId !== dbUserId) {
      return { error: 'Luggage not found' }
    }

    return { success: true, luggage }
  } catch (error) {
    return { error: 'Failed to fetch luggage history' }
  }
}
