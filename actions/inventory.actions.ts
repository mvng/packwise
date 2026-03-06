'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
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

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', icon: '📱', order: 0 },
  { name: 'Toiletries', icon: '🧴', order: 1 },
  { name: 'Clothing', icon: '👕', order: 2 },
  { name: 'Documents', icon: '📄', order: 3 },
  { name: 'Accessories', icon: '🎒', order: 4 },
  { name: 'Health & Safety', icon: '💊', order: 5 },
]

// Initialize default categories for new users
export async function initializeInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const existing = await prisma.inventoryCategory.count({ where: { userId } })
    if (existing > 0) return { success: true } // Already initialized

    await prisma.inventoryCategory.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId })),
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to initialize inventory' }
  }
}

// Get all inventory items with categories
export async function getInventory() {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const categories = await prisma.inventoryCategory.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: [{ isFavorite: 'desc' }, { order: 'asc' }],
        },
      },
    })

    return { categories }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch inventory' }
  }
}

// Create inventory item
export async function createInventoryItem(input: {
  categoryId: string
  name: string
  brand?: string
  size?: string
  notes?: string
  imageUrl?: string
  quantity?: number
  tags?: string[]
}) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify category belongs to user
    const category = await prisma.inventoryCategory.findFirst({
      where: { id: input.categoryId, userId },
    })
    if (!category) return { error: 'Category not found' }

    const maxOrder = await prisma.inventoryItem.findFirst({
      where: { categoryId: input.categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const item = await prisma.inventoryItem.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        brand: input.brand,
        size: input.size,
        notes: input.notes,
        imageUrl: input.imageUrl,
        quantity: input.quantity ?? 1,
        tags: input.tags ?? [],
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    revalidatePath('/inventory')
    return { success: true, item }
  } catch (error: any) {
    return { error: error.message || 'Failed to create item' }
  }
}

// Update inventory item
export async function updateInventoryItem(
  itemId: string,
  data: {
    name?: string
    brand?: string
    size?: string
    notes?: string
    imageUrl?: string
    quantity?: number
    tags?: string[]
    isFavorite?: boolean
  }
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify item belongs to user
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId },
      include: { category: true },
    })
    if (!item || item.category.userId !== userId) {
      return { error: 'Item not found' }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data,
    })

    revalidatePath('/inventory')
    return { success: true, item: updated }
  } catch (error: any) {
    return { error: error.message || 'Failed to update item' }
  }
}

// Delete inventory item
export async function deleteInventoryItem(itemId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId },
      include: { category: true },
    })
    if (!item || item.category.userId !== userId) {
      return { error: 'Item not found' }
    }

    await prisma.inventoryItem.delete({ where: { id: itemId } })

    revalidatePath('/inventory')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete item' }
  }
}

// Create custom category
export async function createInventoryCategory(name: string, icon?: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const maxOrder = await prisma.inventoryCategory.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const category = await prisma.inventoryCategory.create({
      data: {
        userId,
        name,
        icon,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    revalidatePath('/inventory')
    return { success: true, category }
  } catch (error: any) {
    return { error: error.message || 'Failed to create category' }
  }
}

// Add inventory items to packing list
export async function addInventoryItemsToPackingList(
  tripId: string,
  packingCategoryId: string,
  inventoryItemIds: string[]
) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify trip belongs to user
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId },
    })
    if (!trip) return { error: 'Trip not found' }

    // Verify category belongs to trip
    const category = await prisma.category.findFirst({
      where: { id: packingCategoryId },
      include: { packingList: true },
    })
    if (!category || category.packingList.tripId !== tripId) {
      return { error: 'Category not found' }
    }

    // Fetch inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds } },
      include: { category: true },
    })

    // Verify all items belong to user
    if (inventoryItems.some(item => item.category.userId !== userId)) {
      return { error: 'Unauthorized' }
    }

    // Get max order in category
    const maxOrder = await prisma.packingItem.findFirst({
      where: { categoryId: packingCategoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    let currentOrder = (maxOrder?.order ?? -1) + 1

    // Create packing items
    await prisma.packingItem.createMany({
      data: inventoryItems.map(item => ({
        categoryId: packingCategoryId,
        name: item.name,
        quantity: item.quantity,
        isPacked: false,
        isCustom: false,
        order: currentOrder++,
      })),
    })

    // Increment usage count for analytics
    await prisma.inventoryItem.updateMany({
      where: { id: { in: inventoryItemIds } },
      data: { timesUsed: { increment: 1 } },
    })

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to add items' }
  }
}
