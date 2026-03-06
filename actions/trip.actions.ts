'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generatePackingList } from '@/utils/packingGenerator'
import { CreateTripInput } from '@/types'
import { getTripDuration } from '@/lib/utils'

export async function createTrip(input: CreateTripInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        destination: input.destination,
        startDate: input.startDate,
        endDate: input.endDate,
        tripType: input.tripType,
        notes: input.notes,
      },
    })

    const duration = getTripDuration(input.startDate, input.endDate)
    const categories = generatePackingList(input.tripType, duration)

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

    revalidatePath('/dashboard')
    return { success: true, tripId: trip.id }
  } catch (error) {
    console.error('Create trip error:', error)
    return { error: 'Failed to create trip' }
  }
}

export async function getUserTrips() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const trips = await prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'asc' },
      include: {
        packingLists: {
          include: { categories: { include: { items: true } } },
        },
      },
    })

    return { trips }
  } catch (error) {
    return { error: 'Failed to fetch trips' }
  }
}

export async function getTripById(tripId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: user.id },
      include: {
        packingLists: {
          include: {
            categories: {
              include: { items: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!trip) return { error: 'Trip not found' }
    return { trip }
  } catch (error) {
    return { error: 'Failed to fetch trip' }
  }
}

export async function deleteTrip(tripId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    await prisma.trip.delete({ where: { id: tripId, userId: user.id } })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete trip' }
  }
}
