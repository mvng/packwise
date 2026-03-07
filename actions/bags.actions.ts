'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const BAG_TYPES = ['backpack', 'carry-on', 'check-in', 'duffel', 'tote', 'personal', 'trunk', 'other'] as const
export type BagType = typeof BAG_TYPES[number]

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  let authUser: any = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    authUser = user
  } catch {}

  if (!authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user ?? null
    } catch {}
  }

  if (authUser) {
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

  const cookieStore = await cookies()
  if (cookieStore.get('guest_mode')?.value === 'true') {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getUserBags() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const bags = await prisma.bag.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { tripBags: { select: { id: true, tripId: true } } },
    })

    return { bags }
  } catch (error: any) {
    console.error('getUserBags error:', error)
    return { error: error.message || 'Failed to fetch bags' }
  }
}

export async function getTripBags(tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } })
    if (!trip) return { error: 'Trip not found' }

    const tripBags = await prisma.tripBag.findMany({
      where: { tripId },
      include: {
        bag: true,
        packingItems: {
          include: { category: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return { tripBags }
  } catch (error: any) {
    console.error('getTripBags error:', error)
    return { error: error.message || 'Failed to fetch trip bags' }
  }
}

// ─── BAG CRUD ─────────────────────────────────────────────────────────────────

export async function createBag(data: {
  name: string
  type?: string
  capacity?: string
  color?: string
  notes?: string
}) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const bag = await prisma.bag.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type ?? 'other',
        capacity: data.capacity?.trim() || null,
        color: data.color?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    })

    revalidatePath('/inventory/bags')
    return { success: true, bag }
  } catch (error: any) {
    console.error('createBag error:', error)
    return { error: error.message || 'Failed to create bag' }
  }
}

export async function updateBag(
  bagId: string,
  data: { name?: string; type?: string; capacity?: string; color?: string; notes?: string }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.bag.findFirst({ where: { id: bagId, userId } })
    if (!existing) return { error: 'Bag not found' }

    const bag = await prisma.bag.update({
      where: { id: bagId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.capacity !== undefined && { capacity: data.capacity.trim() || null }),
        ...(data.color !== undefined && { color: data.color.trim() || null }),
        ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
      },
    })

    revalidatePath('/inventory/bags')
    return { success: true, bag }
  } catch (error: any) {
    console.error('updateBag error:', error)
    return { error: error.message || 'Failed to update bag' }
  }
}

export async function deleteBag(bagId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.bag.findFirst({ where: { id: bagId, userId } })
    if (!existing) return { error: 'Bag not found' }

    await prisma.bag.delete({ where: { id: bagId } })

    revalidatePath('/inventory/bags')
    return { success: true }
  } catch (error: any) {
    console.error('deleteBag error:', error)
    return { error: error.message || 'Failed to delete bag' }
  }
}

// ─── TRIP BAG ASSIGNMENT ──────────────────────────────────────────────────────

export async function addBagToTrip(tripId: string, bagId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const [trip, bag] = await Promise.all([
      prisma.trip.findFirst({ where: { id: tripId, userId } }),
      prisma.bag.findFirst({ where: { id: bagId, userId } }),
    ])
    if (!trip) return { error: 'Trip not found' }
    if (!bag) return { error: 'Bag not found' }

    const tripBag = await prisma.tripBag.upsert({
      where: { tripId_bagId: { tripId, bagId } },
      create: { tripId, bagId },
      update: {},
      include: { bag: true, packingItems: true },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true, tripBag }
  } catch (error: any) {
    console.error('addBagToTrip error:', error)
    return { error: error.message || 'Failed to add bag to trip' }
  }
}

export async function removeBagFromTrip(tripId: string, tripBagId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } })
    if (!trip) return { error: 'Trip not found' }

    // Unassign all packing items from this bag before removing
    await prisma.packingItem.updateMany({
      where: { bagId: tripBagId },
      data: { bagId: null },
    })

    await prisma.tripBag.delete({ where: { id: tripBagId } })

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error: any) {
    console.error('removeBagFromTrip error:', error)
    return { error: error.message || 'Failed to remove bag from trip' }
  }
}

export async function assignItemToBag(itemId: string, tripBagId: string | null, tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify item ownership via trip
    const item = await prisma.packingItem.findFirst({
      where: { id: itemId },
      include: {
        category: {
          include: {
            packingList: {
              include: { trip: { select: { userId: true, id: true } } },
            },
          },
        },
      },
    })
    if (!item || item.category.packingList.trip.userId !== userId) {
      return { error: 'Item not found' }
    }

    // If assigning to a bag, verify it belongs to this trip
    if (tripBagId) {
      const tripBag = await prisma.tripBag.findFirst({
        where: { id: tripBagId, tripId },
      })
      if (!tripBag) return { error: 'Bag not on this trip' }
    }

    await prisma.packingItem.update({
      where: { id: itemId },
      data: { bagId: tripBagId },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error: any) {
    console.error('assignItemToBag error:', error)
    return { error: error.message || 'Failed to assign item to bag' }
  }
}
