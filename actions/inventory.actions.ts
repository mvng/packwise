'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

// ─── Category actions ────────────────────────────────────────────────────────

export async function getUserInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const categories = await prisma.inventoryCategory.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    })

    return { categories }
  } catch (error: any) {
    console.error('Get inventory error:', error)
    return { error: error.message || 'Failed to fetch inventory' }
  }
}

export async function createInventoryCategory(name: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const last = await prisma.inventoryCategory.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const category = await prisma.inventoryCategory.create({
      data: { userId, name, order: (last?.order ?? -1) + 1 },
    })

    revalidatePath('/inventory')
    return { success: true as const, category }
  } catch (error: any) {
    console.error('Create category error:', error)
    return { error: error.message || 'Failed to create category' }
  }
}

export async function updateInventoryCategory(categoryId: string, name: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, userId },
    })
    if (!owned) return { error: 'Category not found' }

    const category = await prisma.inventoryCategory.update({
      where: { id: categoryId },
      data: { name },
    })

    revalidatePath('/inventory')
    return { success: true as const, category }
  } catch (error: any) {
    return { error: error.message || 'Failed to update category' }
  }
}

export async function deleteInventoryCategory(categoryId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, userId },
    })
    if (!owned) return { error: 'Category not found' }

    await prisma.inventoryCategory.delete({ where: { id: categoryId } })
    revalidatePath('/inventory')
    return { success: true as const }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete category' }
  }
}

// ─── Item actions ─────────────────────────────────────────────────────────────

export async function createInventoryItem(data: {
  categoryId: string
  name: string
  quantity?: number
  notes?: string
}) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const ownedCategory = await prisma.inventoryCategory.findFirst({
      where: { id: data.categoryId, userId },
    })
    if (!ownedCategory) return { error: 'Category not found' }

    const last = await prisma.inventoryItem.findFirst({
      where: { categoryId: data.categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const item = await prisma.inventoryItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        quantity: data.quantity ?? 1,
        notes: data.notes ?? null,
        isFavorite: false,
        order: (last?.order ?? -1) + 1,
      },
    })

    revalidatePath('/inventory')
    return { success: true as const, item }
  } catch (error: any) {
    return { error: error.message || 'Failed to create item' }
  }
}

export async function updateInventoryItem(
  itemId: string,
  data: { name?: string; quantity?: number; notes?: string; isFavorite?: boolean }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.inventoryItem.findFirst({
      where: { id: itemId, category: { userId } },
    })
    if (!owned) return { error: 'Item not found' }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data,
    })

    revalidatePath('/inventory')
    return { success: true as const, item }
  } catch (error: any) {
    return { error: error.message || 'Failed to update item' }
  }
}

export async function deleteInventoryItem(itemId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const owned = await prisma.inventoryItem.findFirst({
      where: { id: itemId, category: { userId } },
    })
    if (!owned) return { error: 'Item not found' }

    await prisma.inventoryItem.delete({ where: { id: itemId } })
    revalidatePath('/inventory')
    return { success: true as const }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete item' }
  }
}

// ─── Trip integration ─────────────────────────────────────────────────────────

export async function addInventoryItemsToTrip(tripId: string, itemIds: string[]) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } })
    if (!trip) return { error: 'Trip not found' }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { id: { in: itemIds }, category: { userId } },
      include: { category: true },
    })
    if (inventoryItems.length === 0) return { error: 'No valid items found' }

    let packingList = await prisma.packingList.findFirst({ where: { tripId } })
    if (!packingList) {
      packingList = await prisma.packingList.create({
        data: { tripId, name: 'Main Packing List' },
      })
    }

    const existingCategories = await prisma.category.findMany({
      where: { packingListId: packingList.id },
      orderBy: { order: 'asc' },
    })

    const maxCatOrder = existingCategories.reduce((max, c) => Math.max(max, c.order), -1)
    let nextCatOrder = maxCatOrder + 1

    const grouped = new Map<string, typeof inventoryItems>()
    for (const item of inventoryItems) {
      const key = item.category.name
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }

    for (const [catName, items] of grouped) {
      const match = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )

      let packingCategoryId: string
      if (match) {
        packingCategoryId = match.id
      } else {
        const newCat = await prisma.category.create({
          data: { packingListId: packingList.id, name: catName, order: nextCatOrder++ },
        })
        packingCategoryId = newCat.id
      }

      const lastItem = await prisma.packingItem.findFirst({
        where: { categoryId: packingCategoryId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      let orderCounter = (lastItem?.order ?? -1) + 1

      await prisma.packingItem.createMany({
        data: items.map((item) => ({
          categoryId: packingCategoryId,
          name: item.name,
          quantity: item.quantity,
          isPacked: false,
          isCustom: false,
          order: orderCounter++,
        })),
      })
    }

    revalidatePath(`/trip/${tripId}`)
    return { success: true as const, count: inventoryItems.length }
  } catch (error: any) {
    console.error('Add inventory items to trip error:', error)
    return { error: error.message || 'Failed to add items to trip' }
  }
}
