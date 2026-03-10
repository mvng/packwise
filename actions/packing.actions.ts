'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function toggleItemPacked(itemId: string, isPacked: boolean, tripId: string) {
  try {
    await prisma.packingItem.update({
      where: { id: itemId },
      data: { isPacked },
    })
    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error toggling item:', error)
    return { error: 'Failed to update item' }
  }
}

export async function togglePackLast(itemId: string, packLast: boolean, tripId: string) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'Unauthorized' }

    await prisma.packingItem.update({
      where: { id: itemId },
      data: { packLast },
    })
    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error toggling packLast:', error)
    return { error: 'Failed to update item' }
  }
}

export async function addCustomItem(
  categoryId: string,
  name: string,
  quantity: number,
  tripId: string
) {
  try {
    const item = await prisma.packingItem.create({
      data: {
        categoryId,
        name,
        quantity,
        isCustom: true,
      },
    })
    revalidatePath(`/trip/${tripId}`)
    return { item }
  } catch (error) {
    console.error('Error adding item:', error)
    return { error: 'Failed to add item' }
  }
}

export async function deleteItem(itemId: string, tripId: string) {
  try {
    await prisma.packingItem.delete({
      where: { id: itemId },
    })
    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting item:', error)
    return { error: 'Failed to delete item' }
  }
}
