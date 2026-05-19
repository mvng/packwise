import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

    // Explicitly include items so category.items is available
    const existingCategories = await prisma.category.findMany({
      where: { packingListId: packingList.id },
      include: { items: true },
      orderBy: { order: 'asc' },
    })

    let maxCatOrder = existingCategories.reduce((max, c) => Math.max(max, c.order), -1)
    let synced = 0

    // ⚡ Bolt Performance Optimization
    // Why: Prevent N+1 queries by using the pre-fetched existingCategories.items.
    // Also batch database updates and creates outside the loop instead of executing them sequentially.
    // Impact: Massively reduces DB roundtrips and execution time during day-plan syncs.
    const itemsToCreate: Prisma.PackingItemCreateManyInput[] = []
    const updatePromises: Promise<any>[] = []

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

      // Use pre-fetched items or empty array if newly created
      const existingItems = category.items || []
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      for (const item of items) {
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        )
        if (existing) {
          updatePromises.push(
            prisma.packingItem.update({
              where: { id: existing.id },
              data: { quantity: Math.max(existing.quantity, item.quantity) },
            })
          )
        } else {
          maxItemOrder += 1
          itemsToCreate.push({
            categoryId: category.id,
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

    // Execute bulk updates in parallel and single bulk create
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    if (itemsToCreate.length > 0) {
      await prisma.packingItem.createMany({
        data: itemsToCreate
      })
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
