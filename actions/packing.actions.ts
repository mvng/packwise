'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { extractAssigneeName, findOrCreateTripMember } from '@/lib/assignee-parser'

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

    let parsedName = name
    let assigneeId: string | null = null

    const extracted = extractAssigneeName(name)
    if (extracted) {
      parsedName = extracted.cleanText || extracted.name
      const member = await findOrCreateTripMember(tripId, extracted.name)
      assigneeId = member.id
    }

    const item = await prisma.packingItem.create({
      data: {
        categoryId,
        name: parsedName,
        quantity,
        isCustom: true,
        assigneeId,
      },
      include: {
        assignee: true,
      }
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
  }
}

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

// --- GUEST CLAIMING / COLLABORATION ACTIONS ---

export async function generateShareToken(packingListId: string, tripId: string) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'Unauthorized' }

    const prismaUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!prismaUser) return { error: 'Unauthorized' }

    // verify ownership or membership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true }
    })

    if (!trip) return { error: 'Trip not found' }

    const isOwner = trip.userId === prismaUser.id
    const isMember = trip.members.some(m => m.userId === prismaUser.id)

    if (!isOwner && !isMember) {
      return { error: 'Unauthorized' }
    }

    const token = crypto.randomUUID()

    await prisma.packingList.update({
      where: { id: packingListId },
      data: { shareToken: token },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true, token }
  } catch (error) {
    console.error('Error generating share token:', error)
    return { error: 'Failed to generate token' }
  }
}

export async function submitGuestChanges(
  token: string,
  claims: { itemId: string, guestClaimant: string | null }[],
  newItems: { categoryId: string, name: string, quantity: number, guestName: string }[]
) {
  try {
    const list = await prisma.packingList.findUnique({
      where: { shareToken: token },
      include: {
        trip: true,
        categories: {
          include: { items: true }
        }
      }
    })
    if (!list) return { error: 'Invalid share token' }

    // Update claims
    for (const claim of claims) {
      // Verify the item belongs to this list
      const itemExistsInList = list.categories.some(c =>
        c.items.some(i => i.id === claim.itemId)
      )
      if (itemExistsInList) {
        await prisma.packingItem.update({
          where: { id: claim.itemId },
          data: { guestClaimant: claim.guestClaimant }
        })
      }
    }

    // Add new items
    for (const item of newItems) {
      // Verify the category belongs to this list
      const categoryExistsInList = list.categories.some(c => c.id === item.categoryId)
      if (categoryExistsInList) {
        await prisma.packingItem.create({
          data: {
            categoryId: item.categoryId,
            name: item.name,
            quantity: item.quantity,
            isCustom: true,
            guestClaimant: item.guestName
          }
        })
      }
    }

    revalidatePath(`/claim/${token}`)
    revalidatePath(`/trip/${list.tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error submitting guest changes:', error)
    return { error: 'Failed to submit changes' }
  }
}
