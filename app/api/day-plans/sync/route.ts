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

    // Ensure all required categories exist
    for (const [catName] of grouped) {
      let category = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )

      if (!category) {
        maxCatOrder += 1
        category = await prisma.category.create({
          data: { packingListId: packingList.id, name: catName, order: maxCatOrder },
          include: { items: true },
        })
        existingCategories.push(category)
      }
    }

    // Fetch all existing items across all categories at once to avoid N+1 queries
    const existingCatIds = existingCategories.map((c) => c.id)
    const allExistingItems = await prisma.packingItem.findMany({
      where: { categoryId: { in: existingCatIds } },
    })

    const itemsToCreate = []
    const updateOperations = []

    for (const [catName, items] of grouped) {
      const category = existingCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      )
      if (!category) continue

      const categoryItems = allExistingItems.filter((i) => i.categoryId === category.id)
      let maxItemOrder = categoryItems.reduce((max, i) => Math.max(max, i.order), -1)

      // Deduplicate incoming items before processing to avoid multiple creates for the same new item
      const deduplicatedItems = []
      const seenItemNames = new Set()
      for (const item of items) {
        const lowerName = item.name.toLowerCase()
        if (seenItemNames.has(lowerName)) {
          // If we see it again in the same sync payload, just update the max quantity required
          const existingDeduplicated = deduplicatedItems.find(di => di.name.toLowerCase() === lowerName)
          if (existingDeduplicated) {
             existingDeduplicated.quantity = Math.max(existingDeduplicated.quantity, item.quantity)
          }
        } else {
          seenItemNames.add(lowerName)
          deduplicatedItems.push({ ...item })
        }
      }

      for (const item of deduplicatedItems) {
        const existing = categoryItems.find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        )

        if (existing) {
          // Update existing item using operation array for concurrent resolution later
          updateOperations.push(
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

    // Batch database writes resolving N+1 queries pattern
    if (itemsToCreate.length > 0) {
      await prisma.packingItem.createMany({
        data: itemsToCreate,
      })
    }

    if (updateOperations.length > 0) {
      await Promise.all(updateOperations)
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
