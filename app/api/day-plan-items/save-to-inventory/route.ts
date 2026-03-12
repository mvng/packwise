import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { dayPlanId } = body

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prismaUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!prismaUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id: dayPlanId },
      include: { items: true, trip: true },
    })
    if (!dayPlan) return NextResponse.json({ error: 'Day plan not found' }, { status: 404 })
    if (dayPlan.trip.userId !== prismaUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    if (dayPlan.items.length === 0) return NextResponse.json({ saved: 0 })

    // Group items by category name
    const categoryMap = new Map<string, typeof dayPlan.items>()
    for (const item of dayPlan.items) {
      const catName = item.category ?? 'General'
      const key = catName.toLowerCase()
      if (!categoryMap.has(key)) categoryMap.set(key, [])
      categoryMap.get(key)!.push(item)
    }

    // Find existing categories
    const catNames = Array.from(categoryMap.keys())
    const existingCategories = await prisma.inventoryCategory.findMany({
      where: {
        userId: prismaUser.id,
        // Using `in` might be case sensitive, but our original code used `equals: ..., mode: 'insensitive'`.
        // Prisma doesn't support mode: 'insensitive' inside an `in` array directly.
        // Wait, since we are doing batching, it's easiest to just fetch all categories for the user
        // because inventory categories are usually small per user, and it saves complex queries.
      }
    })

    const dbCategoryMap = new Map<string, string>()
    let maxOrder = -1
    for (const cat of existingCategories) {
      dbCategoryMap.set(cat.name.toLowerCase(), cat.id)
      if (cat.order > maxOrder) maxOrder = cat.order
    }

    const categoriesToCreate = []
    for (const [key, items] of categoryMap.entries()) {
      if (!dbCategoryMap.has(key)) {
        maxOrder++
        categoriesToCreate.push({
          userId: prismaUser.id,
          name: items[0].category ?? 'General',
          order: maxOrder
        })
      }
    }

    if (categoriesToCreate.length > 0) {
      await prisma.inventoryCategory.createMany({
        data: categoriesToCreate
      })
      const newCatNames = categoriesToCreate.map(c => c.name)
      const newlyCreated = await prisma.inventoryCategory.findMany({
        where: { userId: prismaUser.id, name: { in: newCatNames } }
      })
      for (const cat of newlyCreated) {
        dbCategoryMap.set(cat.name.toLowerCase(), cat.id)
      }
    }

    // Now we have all category IDs. We need to find existing items in these categories.
    const allCatIds = Array.from(dbCategoryMap.values())
    const existingItems = await prisma.inventoryItem.findMany({
      where: { categoryId: { in: allCatIds } }
    })

    const existingItemsSet = new Set<string>()
    for (const item of existingItems) {
      existingItemsSet.add(`${item.categoryId}:${item.name.toLowerCase()}`)
    }

    // Get max item orders for each category
    const maxItemOrders = await prisma.inventoryItem.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: allCatIds } },
      _max: { order: true }
    })
    const itemOrderMap = new Map(maxItemOrders.map(m => [m.categoryId, m._max.order ?? -1]))

    const itemsToCreate = []
    let saved = 0

    for (const [key, items] of categoryMap.entries()) {
      const catId = dbCategoryMap.get(key)!
      let currentOrder = itemOrderMap.get(catId) ?? -1

      for (const item of items) {
        const itemKey = `${catId}:${item.name.toLowerCase()}`
        if (!existingItemsSet.has(itemKey)) {
          currentOrder++
          itemsToCreate.push({
            categoryId: catId,
            name: item.name,
            quantity: item.quantity,
            notes: item.notes ?? null,
            isFavorite: false,
            order: currentOrder
          })
          // Add to set to prevent duplicates within the same batch
          existingItemsSet.add(itemKey)
          saved++
        }
      }
    }

    if (itemsToCreate.length > 0) {
      await prisma.inventoryItem.createMany({
        data: itemsToCreate
      })
    }

    return NextResponse.json({ saved })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
