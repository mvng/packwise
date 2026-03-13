'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generatePackingList } from '@/utils/packingGenerator'
import { CreateTripInput, TripType, TransportMode } from '@/types'
import { getTripDuration } from '@/lib/utils'
import { getUserId } from '@/lib/auth'

async function getUserHomeCityById(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { homeCity: true },
    })
    return user?.homeCity ?? null
  } catch {
    return null
  }
}

export async function createTrip(input: CreateTripInput) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const startDate = input.startDate ?? new Date()
    const endDate = input.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const tripType = input.tripType as TripType
    const transportMode = (input.transportMode ?? null) as TransportMode | null

    const trip = await prisma.trip.create({
      data: {
        userId,
        name: input.name || input.destination,
        destination: input.destination,
        startDate,
        endDate,
        tripType,
        transportMode,
        notes: input.notes,
        hotelConfirmationUrl: input.hotelConfirmationUrl ?? null,
      },
    })

    if (input.generateSuggestions) {
      const duration = getTripDuration(startDate, endDate)
      const homeCity = await getUserHomeCityById(userId)
      const categories = generatePackingList(tripType, duration, transportMode, {
        homeCity,
        destination: input.destination,
        hotelConfirmationUrl: input.hotelConfirmationUrl,
      })

      await prisma.packingList.create({
        data: {
          tripId: trip.id,
          name: 'Main Packing List',
          categories: {
            create: categories.map((category) => ({
              name: category.name,
              order: category.order,
              items: {
                create: category.items.map((item, index) => ({
                  name: item,
                  quantity: 1,
                  isPacked: false,
                  isCustom: false,
                  order: index,
                })),
              },
            })),
          },
        },
      })
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
    transportMode?: string | null
    notes?: string | null
    hotelConfirmationUrl?: string | null
  }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

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
        transportMode: input.transportMode ?? null,
        notes: input.notes ?? undefined,
        hotelConfirmationUrl: input.hotelConfirmationUrl ?? null,
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

export async function getDashboardTrips() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        destination: true,
        startDate: true,
        endDate: true,
        tripType: true,
        hotelConfirmationUrl: true,
        notes: true,
        createdAt: true,
      },
    })

    return { trips }
  } catch (error: any) {
    console.error('Get dashboard trips error:', error)
    return { error: error.message || 'Failed to fetch dashboard trips' }
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

export async function getSharedTripById(tripId: string) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: { select: { name: true, email: true } },
        tripLuggages: {
          include: { luggage: true },
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        members: { orderBy: { createdAt: 'asc' } },
        packingLists: {
          include: {
            categories: {
              include: {
                items: {
                  include: {
                    tripLuggage: { include: { luggage: true } },
                    assignee: true
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

export async function forkTrip(
  sourceTripId: string,
  localStorageState?: Record<string, boolean> | null
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized', requiresAuth: true }

    const sourceTrip = await prisma.trip.findUnique({
      where: { id: sourceTripId },
      include: {
        packingLists: {
          include: { categories: { include: { items: true } } }
        }
      }
    })

    if (!sourceTrip) return { error: 'Trip not found' }
    if (sourceTrip.userId === userId) return { error: 'You already own this trip', alreadyOwned: true }

    const newTrip = await prisma.trip.create({
      data: {
        userId,
        name: `${sourceTrip.name} (Copy)`,
        destination: sourceTrip.destination,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        tripType: sourceTrip.tripType,
        transportMode: sourceTrip.transportMode,
        notes: sourceTrip.notes,
        packingLists: {
          create: sourceTrip.packingLists.map((sourceList) => ({
            name: sourceList.name,
            categories: {
              create: sourceList.categories.map((sourceCategory) => ({
                name: sourceCategory.name,
                order: sourceCategory.order,
                items: {
                  create: sourceCategory.items.map((sourceItem) => ({
                    name: sourceItem.name,
                    quantity: sourceItem.quantity,
                    isPacked: localStorageState?.[sourceItem.id] ?? false,
                    isCustom: sourceItem.isCustom,
                    order: sourceItem.order,
                  })),
                },
              })),
            },
          })),
        },
      },
    })

    revalidatePath('/dashboard')

    const hasLocalStorageState = localStorageState && Object.keys(localStorageState).length > 0
    return {
      success: true,
      tripId: newTrip.id,
      message: hasLocalStorageState
        ? 'Trip copied to your account with your checked items!'
        : 'Trip copied to your account successfully!'
    }
  } catch (error: any) {
    console.error('Fork trip error:', error)
    return { error: error.message || 'Failed to copy trip' }
  }
}
