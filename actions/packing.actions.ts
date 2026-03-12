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
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify user owns the trip that this category belongs to
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        packingList: {
          trip: {
            userId: user.id
          }
        }
      }
    })

    if (!category) return { error: 'Unauthorized' }

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

export async function updateItemNotes(itemId: string, notes: string | null, tripId: string) {
  try {
    const item = await prisma.packingItem.update({
      where: { id: itemId },
      data: { notes },
    })
    revalidatePath(`/trip/${tripId}`)
    return { item }
  } catch (error) {
    console.error('Failed to update item notes:', error)
    return { error: 'Failed to update item notes' }
  }
}

export async function assignItemToMember(itemId: string, assigneeId: string | null, tripId: string) {
  try {
    const item = await prisma.packingItem.update({
      where: { id: itemId },
      data: { assigneeId },
    })
    revalidatePath(`/trip/${tripId}`)
    return { item }
  } catch (error) {
    console.error('Failed to assign item:', error)
    return { error: 'Failed to assign item' }
export async function importItemsToTrip(
  tripId: string,
  items: { name: string; quantity: number }[]
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify user owns the trip
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: user.id },
      include: {
        packingLists: {
          include: {
            categories: true
          }
        }
      }
    })

    if (!trip) return { error: 'Trip not found or unauthorized' }

    // Determine the packing list to use. Create one if it doesn't exist.
    let packingListId: string
    if (trip.packingLists.length > 0) {
      packingListId = trip.packingLists[0].id
    } else {
      const newList = await prisma.packingList.create({
        data: {
          tripId: trip.id,
          name: 'Main Packing List',
        }
      })
      packingListId = newList.id
    }

    // Find or create an "Imported" category
    let importedCategory = await prisma.category.findFirst({
      where: {
        packingListId: packingListId,
        name: 'Imported'
      }
    })

    if (!importedCategory) {
      const maxOrderCat = await prisma.category.findFirst({
        where: { packingListId: packingListId },
        orderBy: { order: 'desc' }
      })
      const newOrder = maxOrderCat ? maxOrderCat.order + 1 : 0

      importedCategory = await prisma.category.create({
        data: {
          packingListId: packingListId,
          name: 'Imported',
          order: newOrder
        }
      })
    }

    // Bulk insert the items
    const maxOrderItem = await prisma.packingItem.findFirst({
      where: { categoryId: importedCategory.id },
      orderBy: { order: 'desc' }
    })
    let currentOrder = maxOrderItem ? maxOrderItem.order + 1 : 0

    await prisma.packingItem.createMany({
      data: items.map(item => ({
        categoryId: importedCategory!.id,
        name: item.name,
        quantity: item.quantity,
        isCustom: true,
        isPacked: false,
        order: currentOrder++
      }))
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true, count: items.length }
  } catch (error) {
    console.error('Error importing items:', error)
    return { error: 'Failed to import items' }
  }
}
