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

    // ⚡ Bolt Performance Optimization
    // Why: Accumulating operations allows us to use a single database transaction,
    // and using pre-fetched category.items avoids an N+1 query loop.
    // Impact: Drastically reduces DB round trips and speeds up sync time.
    const dbOperations = []

    for (const [catName, items] of grouped) {
      let category = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )

      if (!category) {
        maxCatOrder += 1
        category = await prisma.category.create({
          data: { packingListId: packingList.id, name: catName, order: maxCatOrder },
          include: { items: true },
        })
      }

      const existingItems = category.items || []
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      // Deduplicate items within the payload to prevent transaction errors
      const aggregatedItems = new Map<string, number>()
      for (const item of items) {
        const key = item.name.toLowerCase()
        aggregatedItems.set(key, Math.max(aggregatedItems.get(key) || 0, item.quantity))
      }

      const itemsToCreate = []

      for (const [itemNameKey, maxQuantity] of aggregatedItems) {
        const originalItem = items.find(i => i.name.toLowerCase() === itemNameKey)!
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === itemNameKey
        )

        if (existing) {
          dbOperations.push(
            prisma.packingItem.update({
              where: { id: existing.id },
              data: { quantity: Math.max(existing.quantity, maxQuantity) },
            })
          )
        } else {
          maxItemOrder += 1
          itemsToCreate.push({
            categoryId: category.id,
            name: originalItem.name,
            quantity: maxQuantity,
            isPacked: false,
            isCustom: true,
            packLast: false,
            order: maxItemOrder,
          })
          synced++
        }
      }

      if (itemsToCreate.length > 0) {
        dbOperations.push(
          prisma.packingItem.createMany({
            data: itemsToCreate
          })
        )
      }
    }

    if (dbOperations.length > 0) {
      await prisma.$transaction(dbOperations)
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
