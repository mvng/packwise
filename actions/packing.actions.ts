'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the Prisma User.id (not the Supabase auth UUID).
 * Mirrors the getUserId() pattern in trip.actions.ts exactly so that
 * foreign key constraints are satisfied for both authenticated and guest users.
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
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}

export async function toggleItemPacked(itemId: string, isPacked: boolean, tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const { count } = await prisma.packingItem.updateMany({
      where: {
        id: itemId,
        category: {
          packingList: {
            trip: {
              id: tripId,
              userId,
            },
          },
        },
      },
      data: { isPacked },
    })

    if (count === 0) {
      return { error: 'Item not found or unauthorized' }
    }

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error toggling item:', error)
    return { error: 'Failed to update item' }
  }
}

export async function togglePackLast(itemId: string, packLast: boolean, tripId: string) {
  try {
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const { count } = await prisma.packingItem.updateMany({
      where: {
        id: itemId,
        category: {
          packingList: {
            trip: {
              id: tripId,
              userId,
            },
          },
        },
      },
      data: { packLast },
    })

    if (count === 0) {
      return { error: 'Item not found or unauthorized' }
    }

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
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    // Verify category belongs to user's trip
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        packingList: {
          trip: {
            id: tripId,
            userId,
          },
        },
      },
    })

    if (!category) {
      return { error: 'Category not found or unauthorized' }
    }

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
    const userId = await getUserId()
    if (!userId) return { error: 'Unauthorized' }

    const { count } = await prisma.packingItem.deleteMany({
      where: {
        id: itemId,
        category: {
          packingList: {
            trip: {
              id: tripId,
              userId,
            },
          },
        },
      },
    })

    if (count === 0) {
      return { error: 'Item not found or unauthorized' }
    }

    revalidatePath(`/trip/${tripId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting item:', error)
    return { error: 'Failed to delete item' }
  }
}
