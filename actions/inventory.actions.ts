'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_CATEGORIES = ['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Accessories']

/**
 * Returns the PRISMA User.id for the authenticated user.
 * Mirrors the pattern in trip.actions.ts exactly.
 */
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

export async function getUserInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const categories = await prisma.inventoryCategory.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    // Seed practical defaults on first visit
    if (categories.length === 0) {
      const seeded = await prisma.$transaction(
        DEFAULT_CATEGORIES.map((name, index) =>
          prisma.inventoryCategory.create({
            data: { userId, name, order: index },
            include: { items: true },
          })
        )
      )
      return { categories: seeded }
    }

    return { categories }
  } catch (error: any) {
    console.error('getUserInventory error:', error)
    return { error: error.message || 'Failed to fetch inventory' }
  }
}

// ─── CATEGORY MUTATIONS ───────────────────────────────────────────────────────

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
      data: { userId, name: name.trim(), order: (last?.order ?? -1) + 1 },
      include: { items: true },
    })

    revalidatePath('/inventory')
    return { success: true, category }
  } catch (error: any) {
    console.error('createInventoryCategory error:', error)
    return { error: error.message || 'Failed to create category' }
  }
}

export async function updateInventoryCategory(categoryId: string, name: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, userId },
    })
    if (!existing) return { error: 'Category not found' }

    const category = await prisma.inventoryCategory.update({
      where: { id: categoryId },
      data: { name: name.trim() },
    })

    revalidatePath('/inventory')
    return { success: true, category }
  } catch (error: any) {
    console.error('updateInventoryCategory error:', error)
    return { error: error.message || 'Failed to update category' }
  }
}

export async function deleteInventoryCategory(categoryId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, userId },
    })
    if (!existing) return { error: 'Category not found' }

    await prisma.inventoryCategory.delete({ where: { id: categoryId } })

    revalidatePath('/inventory')
    return { success: true }
  } catch (error: any) {
    console.error('deleteInventoryCategory error:', error)
    return { error: error.message || 'Failed to delete category' }
  }
}

// ─── ITEM MUTATIONS ───────────────────────────────────────────────────────────

export async function createInventoryItem(
  categoryId: string,
  data: { name: string; quantity?: number; notes?: string }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const category = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, userId },
    })
    if (!category) return { error: 'Category not found' }

    const last = await prisma.inventoryItem.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const item = await prisma.inventoryItem.create({
      data: {
        categoryId,
        name: data.name.trim(),
        quantity: data.quantity ?? 1,
        notes: data.notes?.trim() || null,
        order: (last?.order ?? -1) + 1,
      },
    })

    revalidatePath('/inventory')
    return { success: true, item }
  } catch (error: any) {
    console.error('createInventoryItem error:', error)
    return { error: error.message || 'Failed to create item' }
  }
}

export async function updateInventoryItem(
  itemId: string,
  data: { name?: string; quantity?: number; notes?: string }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId },
      include: { category: { select: { userId: true } } },
    })
    if (!existing || existing.category.userId !== userId) return { error: 'Item not found' }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
      },
    })

    revalidatePath('/inventory')
    return { success: true, item }
  } catch (error: any) {
    console.error('updateInventoryItem error:', error)
    return { error: error.message || 'Failed to update item' }
  }
}

export async function deleteInventoryItem(itemId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId },
      include: { category: { select: { userId: true } } },
    })
    if (!existing || existing.category.userId !== userId) return { error: 'Item not found' }

    await prisma.inventoryItem.delete({ where: { id: itemId } })

    revalidatePath('/inventory')
    return { success: true }
  } catch (error: any) {
    console.error('deleteInventoryItem error:', error)
    return { error: error.message || 'Failed to delete item' }
  }
}

export async function toggleInventoryItemFavorite(itemId: string, isFavorite: boolean) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId },
      include: { category: { select: { userId: true } } },
    })
    if (!existing || existing.category.userId !== userId) return { error: 'Item not found' }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { isFavorite },
    })

    return { success: true, item }
  } catch (error: any) {
    console.error('toggleInventoryItemFavorite error:', error)
    return { error: error.message || 'Failed to update item' }
  }
}

// ─── TRIP INTEGRATION ─────────────────────────────────────────────────────────

export async function addInventoryItemsToTrip(
  tripId: string,
  items: Array<{
    inventoryItemId: string
    categoryName: string
    name: string
    quantity: number
  }>
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: { packingLists: { take: 1 } },
    })
    if (!trip) return { error: 'Trip not found' }

    // Verify all inventory items belong to this user
    const inventoryItemIds = items.map((i) => i.inventoryItemId)
    const ownedItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds } },
      include: { category: { select: { userId: true } } },
    })
    if (ownedItems.some((i) => i.category.userId !== userId)) {
      return { error: 'One or more items not found' }
    }

    // Get or create the main packing list
    let packingListId = trip.packingLists[0]?.id
    if (!packingListId) {
      const pl = await prisma.packingList.create({
        data: { tripId, name: 'Main Packing List' },
      })
      packingListId = pl.id
    }

    // Load existing packing list categories
    const existingCategories = await prisma.category.findMany({
      where: { packingListId },
      orderBy: { order: 'desc' },
    })

    const categoryMap = new Map<string, string>()
    let maxOrder = existingCategories[0]?.order ?? -1
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id)
    }

    // Find or create a matching category for each item's source category
    for (const item of items) {
      const key = item.categoryName.toLowerCase()
      if (!categoryMap.has(key)) {
        const newCat = await prisma.category.create({
          data: { packingListId, name: item.categoryName, order: ++maxOrder },
        })
        categoryMap.set(key, newCat.id)
      }
    }

    // Insert packing items
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.packingItem.create({
          data: {
            categoryId: categoryMap.get(item.categoryName.toLowerCase())!,
            name: item.name,
            quantity: item.quantity,
            isPacked: false,
            isCustom: true,
            order: 0,
          },
        })
      )
    )

    revalidatePath(`/trip/${tripId}`)
    return { success: true, count: created.length }
  } catch (error: any) {
    console.error('addInventoryItemsToTrip error:', error)
    return { error: error.message || 'Failed to add items to trip' }
  }
}
