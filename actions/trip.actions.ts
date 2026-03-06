'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generatePackingList } from '@/utils/packingGenerator'
import { CreateTripInput, TripType } from '@/types'
import { getTripDuration } from '@/lib/utils'

// Helper to get user ID (authenticated or guest)
async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  
  if (isGuestMode) {
    // Use a fixed guest user ID or create one from session
    let guestId = cookieStore.get('guest_user_id')?.value
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      // Note: We can't set cookies here in a server action helper
      // The guest ID will be regenerated each time, which is acceptable for demo purposes
    }
    return guestId
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
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
  } catch (error) {
    console.error('Create trip error:', error)
    return { error: 'Failed to create trip' }
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
  } catch (error) {
    return { error: 'Failed to fetch trips' }
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
  } catch (error) {
    return { error: 'Failed to fetch trip' }
  }
}

export async function deleteTrip(tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    await prisma.trip.delete({ where: { id: tripId, userId } })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete trip' }
  }
}
