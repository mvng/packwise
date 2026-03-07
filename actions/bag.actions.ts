'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}

export type BagType = 'backpack' | 'carry-on' | 'checked' | 'personal-item' | 'trunk' | 'other'

export interface BagData {
  name: string
  brand?: string
  type: BagType
  capacity?: number
  color?: string
  notes?: string
}

// ─── Bag CRUD ────────────────────────────────────────────────────────────────

export async function getUserBags() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const bags = await prisma.bag.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return { bags }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch bags' }
  }
}

export async function createBag(data: BagData) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const bag = await prisma.bag.create({
      data: {
        userId,
        name: data.name,
        brand: data.brand ?? null,
        type: data.type,
        capacity: data.capacity ?? null,
        color: data.color ?? null,
        notes: data.notes ?? null,
      },
    })

    revalidatePath('/bags')
    return { success: true as const, bag }
  } catch (error: any) {
    return { error: error.message || 'Failed to create bag' }
  }
}

export async function updateBag(bagId: string, data: Partial<BagData>) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.bag.findFirst({ where: { id: bagId, userId } })
    if (!owned) return { error: 'Bag not found' }

    const bag = await prisma.bag.update({
      where: { id: bagId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.brand !== undefined && { brand: data.brand ?? null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.capacity !== undefined && { capacity: data.capacity ?? null }),
        ...(data.color !== undefined && { color: data.color ?? null }),
        ...(data.notes !== undefined && { notes: data.notes ?? null }),
      },
    })

    revalidatePath('/bags')
    return { success: true as const, bag }
  } catch (error: any) {
    return { error: error.message || 'Failed to update bag' }
  }
}

export async function deleteBag(bagId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.bag.findFirst({ where: { id: bagId, userId } })
    if (!owned) return { error: 'Bag not found' }

    await prisma.bag.delete({ where: { id: bagId } })
    revalidatePath('/bags')
    return { success: true as const }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete bag' }
  }
}

// ─── Trip Bag actions ─────────────────────────────────────────────────────────

export async function getTripBags(tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized', tripBags: [] as any[] }

    const tripBags = await prisma.tripBag.findMany({
      where: { tripId },
      include: {
        bag: true,
        packingItems: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return { tripBags }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch trip bags', tripBags: [] as any[] }
  }
}

export async function upsertTripBag(tripId: string, bagId: string, isBringing: boolean) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const ownedBag = await prisma.bag.findFirst({ where: { id: bagId, userId } })
    if (!ownedBag) return { error: 'Bag not found' }

    const tripBag = await prisma.tripBag.upsert({
      where: { tripId_bagId: { tripId, bagId } },
      create: { tripId, bagId, isBringing },
      update: { isBringing },
      include: { bag: true },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true as const, tripBag }
  } catch (error: any) {
    return { error: error.message || 'Failed to update trip bag' }
  }
}

export async function removeTripBag(tripId: string, bagId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    await prisma.tripBag.deleteMany({ where: { tripId, bagId } })
    revalidatePath(`/trip/${tripId}`)
    return { success: true as const }
  } catch (error: any) {
    return { error: error.message || 'Failed to remove bag from trip' }
  }
}

// ─── Item → Bag assignment ────────────────────────────────────────────────────

export async function assignItemToBag(
  itemId: string,
  tripBagId: string | null,
  tripId: string
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.packingItem.findFirst({
      where: { id: itemId, category: { packingList: { trip: { userId } } } },
    })
    if (!owned) return { error: 'Item not found' }

    const item = await prisma.packingItem.update({
      where: { id: itemId },
      data: { tripBagId },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true as const, item }
  } catch (error: any) {
    return { error: error.message || 'Failed to assign item to bag' }
  }
}
