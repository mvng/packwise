'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generatePackingList } from '@/utils/packingGenerator'
import { CreateTripInput, TripType } from '@/types'
import { getTripDuration } from '@/lib/utils'

/**
 * Returns the PRISMA User.id (not the Supabase auth UUID) so that the
 * Trip.userId foreign key constraint is satisfied.
 *
 * Priority:
 * 1. supabase.auth.getUser()  — validates JWT with Supabase API (most secure)
 * 2. supabase.auth.getSession() — reads local cookie, no network call
 *    (fallback when Supabase project is paused or API is unreachable)
 * 3. guest_user_id cookie      — for demo/guest users
 *
 * When a Supabase user is found, a Prisma User row is upserted so that
 * the Trip.userId FK constraint (which references User.id) is satisfied.
 */
async function getUserId(): Promise<string | null> {
  const supabase = await createClient()

  let authUser: any = null

  // 1. Try getUser() — validates with Supabase API
  try {
    const { data: { user } } = await supabase.auth.getUser()
    authUser = user
  } catch {}

  // 2. Fall back to getSession() if getUser() failed (e.g. project paused)
  if (!authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user ?? null
    } catch {}
  }

  if (authUser) {
    // Upsert the Prisma User row so Trip.userId FK constraint is satisfied.
    // Trip.userId references User.id (Prisma UUID), not supabase user.id.
    const prismaUser = await prisma.user.upsert({
      where: { supabaseId: authUser.id },
      create: {
        supabaseId: authUser.id,
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        authProvider: authUser.app_metadata?.provider ?? 'email',
      },
      update: {
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      },
    })
    return prismaUser.id
  }

  // 3. Fall back to guest mode
  const cookieStore = await cookies()
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}

export async function createTrip(input: CreateTripInput) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const startDate = input.startDate ?? new Date()
    const endDate = input.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const tripType = input.tripType as TripType

    const trip = await prisma.trip.create({
      data: {
        userId,
        name: input.name || input.destination,
        destination: input.destination,
        startDate,
        endDate,
        tripType,
        notes: input.notes,
      },
    })

    if (input.generateSuggestions) {
      const duration = getTripDuration(startDate, endDate)
      const categories = generatePackingList(tripType, duration)

      const packingList = await prisma.packingList.create({
        data: { tripId: trip.id, name: 'Main Packing List' },
      })

      for (const category of categories) {
        const cat = await prisma.category.create({
          data: { packingListId: packingList.id, name: category.name, order: category.order },
        })
        await prisma.packingItem.createMany({
          data: category.items.map((item, index) => ({
            categoryId: cat.id, name: item, quantity: 1, isPacked: false, isCustom: false, order: index,
          })),
        })
      }
    }

    revalidatePath('/dashboard')
    return { success: true, tripId: trip.id }
  } catch (error: any) {
    console.error('Create trip error:', error)

    if (error.code === 'P2003') {
      return { error: 'Failed to create trip due to a database configuration issue. Please try again or contact support.' }
    }

    return { error: error.message || 'Failed to create trip' }
  }
}

export async function updateTrip(
  tripId: string,
  input: {
    name?: string | null
    destination?: string
    startDate?: Date | null
    endDate?: Date | null
    tripType?: string | null
    notes?: string | null
  }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify user owns this trip
    const existingTrip = await prisma.trip.findFirst({
      where: { id: tripId, userId }
    })

    if (!existingTrip) return { error: 'Trip not found' }

    await prisma.trip.update({
      where: { id: tripId },
      data: {
        name: input.name ?? undefined,
        destination: input.destination,
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
        tripType: input.tripType ?? undefined,
        notes: input.notes ?? undefined
      }
    })

    revalidatePath('/dashboard')
    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Update trip error:', error)
    return { error: error.message || 'Failed to update trip' }
  }
}

export async function getUserTrips() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { packingLists: { include: { categories: { include: { items: true } } } } },
    })

    return { trips }
  } catch (error: any) {
    console.error('Get trips error:', error)
    return { error: error.message || 'Failed to fetch trips' }
  }
}

export async function getTripById(tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { packingLists: { include: { categories: { include: { items: true } } } } },
    })

    if (!trip) return { error: 'Trip not found' }
    return { trip }
  } catch (error: any) {
    console.error('Get trip error:', error)
    return { error: error.message || 'Failed to fetch trip' }
  }
}

export async function deleteTrip(tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    await prisma.trip.delete({ where: { id: tripId, userId } })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Delete trip error:', error)
    return { error: error.message || 'Failed to delete trip' }
  }
}

/**
 * Get a trip by ID without authentication requirement (for public sharing).
 * This allows unauthenticated users to view shared trips with luggage assignments.
 */
export async function getSharedTripById(tripId: string) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tripLuggage: {
          orderBy: { order: 'asc' }
        },
        packingLists: {
          include: {
            categories: {
              include: {
                items: {
                  include: {
                    tripLuggage: true
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!trip) return { error: 'Trip not found' }
    return { trip }
  } catch (error: any) {
    console.error('Get shared trip error:', error)
    return { error: error.message || 'Failed to fetch trip' }
  }
}

/**
 * Fork (copy) a trip from another user to the current user's account.
 * All packing lists, categories, and items are duplicated with isPacked reset to false.
 * Luggage assignments are not copied.
 */
export async function forkTrip(sourceTripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized', requiresAuth: true }

    // Fetch the source trip without user restriction (public access)
    const sourceTrip = await prisma.trip.findUnique({
      where: { id: sourceTripId },
      include: {
        packingLists: {
          include: {
            categories: {
              include: {
                items: true
              }
            }
          }
        }
      }
    })

    if (!sourceTrip) return { error: 'Trip not found' }

    // Check if user already owns this trip
    if (sourceTrip.userId === userId) {
      return { error: 'You already own this trip', alreadyOwned: true }
    }

    // Create a new trip for the current user
    const newTrip = await prisma.trip.create({
      data: {
        userId,
        name: `${sourceTrip.name} (Copy)`,
        destination: sourceTrip.destination,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        tripType: sourceTrip.tripType,
        notes: sourceTrip.notes,
      }
    })

    // Copy all packing lists, categories, and items
    for (const sourceList of sourceTrip.packingLists) {
      const newList = await prisma.packingList.create({
        data: {
          tripId: newTrip.id,
          name: sourceList.name
        }
      })

      for (const sourceCategory of sourceList.categories) {
        const newCategory = await prisma.category.create({
          data: {
            packingListId: newList.id,
            name: sourceCategory.name,
            order: sourceCategory.order
          }
        })

        // Copy items with isPacked reset to false and no luggage assignments
        await prisma.packingItem.createMany({
          data: sourceCategory.items.map(item => ({
            categoryId: newCategory.id,
            name: item.name,
            quantity: item.quantity,
            isPacked: false, // Reset packing status
            isCustom: item.isCustom,
            order: item.order
            // Note: tripLuggageId is intentionally omitted (no luggage copied)
          }))
        })
      }
    }

    revalidatePath('/dashboard')
    return { 
      success: true, 
      tripId: newTrip.id,
      message: 'Trip copied to your account successfully!'
    }
  } catch (error: any) {
    console.error('Fork trip error:', error)
    return { error: error.message || 'Failed to copy trip' }
  }
}
