'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function toggleItemPacked(itemId: string, isPacked: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    await prisma.packingItem.update({ where: { id: itemId }, data: { isPacked } })
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update item' }
  }
}

export async function addCustomItem(categoryId: string, name: string, quantity: number = 1) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const maxOrder = await prisma.packingItem.findFirst({
      where: { categoryId }, orderBy: { order: 'desc' }, select: { order: true },
    })

    const item = await prisma.packingItem.create({
      data: { categoryId, name, quantity, isPacked: false, isCustom: true, order: (maxOrder?.order ?? -1) + 1 },
    })

    revalidatePath('/trip/[id]')
    return { success: true, item }
  } catch (error) {
    return { error: 'Failed to add item' }
  }
}

export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    await prisma.packingItem.delete({ where: { id: itemId } })
    revalidatePath('/trip/[id]')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete item' }
  }
}

export async function updateItemQuantity(itemId: string, quantity: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    await prisma.packingItem.update({ where: { id: itemId }, data: { quantity } })
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update quantity' }
  }
}
