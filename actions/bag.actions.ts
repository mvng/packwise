'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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

async function getDbUser(supabaseId: string) {
  return prisma.user.findUnique({ where: { supabaseId } })
}

// ---------------------------------------------------------------------------
// User Bag Library
// ---------------------------------------------------------------------------

export async function getUserBags() {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const dbUser = await getDbUser(supabaseId)
    if (!dbUser) return { error: 'User not found' }
    const bags = await prisma.bag.findMany({
      where: { userId: dbUser.id },
      orderBy: { order: 'asc' },
    })
    return { bags }
  } catch {
    return { error: 'Failed to fetch bags' }
  }
}

export async function createBag(name: string, capacity?: string, color?: string) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const dbUser = await getDbUser(supabaseId)
    if (!dbUser) return { error: 'User not found' }
    const maxOrder = await prisma.bag.findFirst({
      where: { userId: dbUser.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const bag = await prisma.bag.create({
      data: { userId: dbUser.id, name, capacity, color, order: (maxOrder?.order ?? -1) + 1 },
    })
    return { bag }
  } catch {
    return { error: 'Failed to create bag' }
  }
}

export async function updateBag(bagId: string, name: string, capacity?: string, color?: string) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const bag = await prisma.bag.update({
      where: { id: bagId },
      data: { name, capacity, color },
    })
    return { bag }
  } catch {
    return { error: 'Failed to update bag' }
  }
}

export async function deleteBag(bagId: string) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    await prisma.bag.delete({ where: { id: bagId } })
    return { success: true }
  } catch {
    return { error: 'Failed to delete bag' }
  }
}

// ---------------------------------------------------------------------------
// Trip Bags
// ---------------------------------------------------------------------------

export async function addBagToTrip(tripId: string, bagId: string) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const maxOrder = await prisma.tripBag.findFirst({
      where: { tripId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const tripBag = await prisma.tripBag.create({
      data: { tripId, bagId, isBringing: true, order: (maxOrder?.order ?? -1) + 1 },
      include: { bag: true },
    })
    revalidatePath(`/trip/${tripId}`)
    return { tripBag }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Bag already added to this trip' }
    return { error: 'Failed to add bag to trip' }
  }
}

export async function createAndAddBagToTrip(
  tripId: string,
  name: string,
  capacity?: string,
  color?: string,
) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const dbUser = await getDbUser(supabaseId)
    if (!dbUser) return { error: 'User not found' }

    const bagMaxOrder = await prisma.bag.findFirst({
      where: { userId: dbUser.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const bag = await prisma.bag.create({
      data: { userId: dbUser.id, name, capacity, color, order: (bagMaxOrder?.order ?? -1) + 1 },
    })

    const tripBagMaxOrder = await prisma.tripBag.findFirst({
      where: { tripId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const tripBag = await prisma.tripBag.create({
      data: { tripId, bagId: bag.id, isBringing: true, order: (tripBagMaxOrder?.order ?? -1) + 1 },
      include: { bag: true },
    })

    revalidatePath(`/trip/${tripId}`)
    return { tripBag }
  } catch {
    return { error: 'Failed to create and add bag' }
  }
}

export async function updateTripBagBringing(
  tripBagId: string,
  isBringing: boolean,
  tripId?: string,
) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    const tripBag = await prisma.tripBag.update({
      where: { id: tripBagId },
      data: { isBringing },
      include: { bag: true },
    })
    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { tripBag }
  } catch {
    return { error: 'Failed to update bag' }
  }
}

export async function removeBagFromTrip(tripBagId: string, tripId?: string) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    // Unassign all items from this bag before deleting
    await prisma.packingItem.updateMany({
      where: { tripBagId },
      data: { tripBagId: null },
    })
    await prisma.tripBag.delete({ where: { id: tripBagId } })
    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to remove bag from trip' }
  }
}

export async function assignItemToBag(
  itemId: string,
  tripBagId: string | null,
  tripId?: string,
) {
  try {
    const supabaseId = await getAuthenticatedUserId()
    if (!supabaseId) return { error: 'Unauthorized' }
    await prisma.packingItem.update({
      where: { id: itemId },
      data: { tripBagId },
    })
    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch {
    return { error: 'Failed to assign item to bag' }
  }
}
