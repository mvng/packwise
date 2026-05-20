import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()
  const { tripId } = body

  try {
    const dayPlans = await prisma.dayPlan.findMany({
      where: { tripId },
      include: { items: true },
    })

    const allItems = dayPlans.flatMap((dp) => dp.items)
    if (allItems.length === 0) return NextResponse.json({ synced: 0 })

    let packingList = await prisma.packingList.findFirst({ where: { tripId } })
    if (!packingList) {
      packingList = await prisma.packingList.create({
        data: { tripId, name: 'Main Packing List' },
      })
    }

    const grouped = new Map<string, typeof allItems>()
    for (const item of allItems) {
      const key = item.category ?? 'General'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }

    const existingCategories = await prisma.category.findMany({
      where: { packingListId: packingList.id },
      include: { items: true },
      orderBy: { order: 'asc' },
    })

    let maxCatOrder = existingCategories.reduce((max, c) => Math.max(max, c.order), -1)
    let synced = 0

    // ⚡ Bolt Performance Optimization: Batched N+1 queries by grouping inserts/updates into arrays
    const categoriesToCreate = []
    const categoryMap = new Map()

    for (const [catName] of grouped) {
      const category = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )

      if (category) {
        categoryMap.set(catName.toLowerCase(), category.id)
      } else {
        maxCatOrder += 1
        categoriesToCreate.push({
          packingListId: packingList.id,
          name: catName,
          order: maxCatOrder
        })
      }
    }

    if (categoriesToCreate.length > 0) {
      await prisma.category.createMany({ data: categoriesToCreate })
      const createdNames = categoriesToCreate.map(c => c.name)
      const newCats = await prisma.category.findMany({
        where: { packingListId: packingList.id, name: { in: createdNames } }
      })
      for (const cat of newCats) {
        categoryMap.set(cat.name.toLowerCase(), cat.id)
      }
    }

    const catIds = Array.from(categoryMap.values())
    const existingItems = await prisma.packingItem.findMany({
      where: { categoryId: { in: catIds } }
    })

    const existingItemsMap = new Map()
    for (const item of existingItems) {
      const key = `${item.categoryId}:${item.name.toLowerCase()}`
      existingItemsMap.set(key, item)
    }

    const maxOrders = await prisma.packingItem.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: catIds } },
      _max: { order: true }
    })
    const maxOrderMap = new Map(maxOrders.map(m => [m.categoryId, m._max.order ?? -1]))

    const itemsToCreate = []
    const itemsToUpdate = []

    for (const [catName, items] of grouped) {
      const catId = categoryMap.get(catName.toLowerCase())
      let maxItemOrder = maxOrderMap.get(catId) ?? -1

      for (const item of items) {
        const key = `${catId}:${item.name.toLowerCase()}`
        const existing = existingItemsMap.get(key)

        if (existing) {
          itemsToUpdate.push({
            id: existing.id,
            quantity: Math.max(existing.quantity, item.quantity)
          })
        } else {
          maxItemOrder += 1
          maxOrderMap.set(catId, maxItemOrder)
          itemsToCreate.push({
            categoryId: catId,
            name: item.name,
            quantity: item.quantity,
            isPacked: false,
            isCustom: true,
            packLast: false,
            order: maxItemOrder,
          })
          synced++
        }
      }
    }

    if (itemsToUpdate.length > 0) {
      await prisma.$transaction(
        itemsToUpdate.map(item =>
          prisma.packingItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity }
          })
        )
      )
    }

    if (itemsToCreate.length > 0) {
      await prisma.packingItem.createMany({ data: itemsToCreate })
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
