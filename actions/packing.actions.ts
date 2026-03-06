'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Always checks Supabase auth first so that logged-in users are never
// accidentally blocked by a stale guest_mode cookie.
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user.id

  // No authenticated session — fall back to guest mode
  const cookieStore = await cookies()
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value || null
  }

  return null
}

export async function toggleItemPacked(itemId: string, isPacked: boolean, tripId?: string) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { error: 'Unauthorized' }
    await prisma.packingItem.update({ where: { id: itemId }, data: { isPacked } })
    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update item' }
  }
}

export async function addCustomItem(categoryId: string, name: string, quantity: number = 1, tripId?: string) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { error: 'Unauthorized' }

    const maxOrder = await prisma.packingItem.findFirst({
      where: { categoryId }, orderBy: { order: 'desc' }, select: { order: true },
    })

    const item = await prisma.packingItem.create({
      data: { categoryId, name, quantity, isPacked: false, isCustom: true, order: (maxOrder?.order ?? -1) + 1 },
    })

    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true, item }
  } catch (error) {
    return { error: 'Failed to add item' }
  }
}

export async function deleteItem(itemId: string, tripId?: string) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { error: 'Unauthorized' }
    await prisma.packingItem.delete({ where: { id: itemId } })
    if (tripId) revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete item' }
  }
}

export async function updateItemQuantity(itemId: string, quantity: number) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { error: 'Unauthorized' }
    await prisma.packingItem.update({ where: { id: itemId }, data: { quantity } })
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update quantity' }
  }
}
