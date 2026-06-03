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

    // ⚡ Bolt Performance Optimization:
    // Accumulate all packing item updates and creates into a single transaction
    // to prevent N+1 queries during day plan syncing.
    const dbOperations: any[] = []

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

      // Use pre-fetched items rather than querying inside the loop
      const existingItems = category.items || []
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      // Deduplicate items to prevent intra-transaction conflicts
      const deduplicatedItems = new Map<string, { name: string, quantity: number }>()
      for (const item of items) {
        const nameKey = item.name.toLowerCase()
        const current = deduplicatedItems.get(nameKey)
        if (!current) {
          deduplicatedItems.set(nameKey, { name: item.name, quantity: item.quantity })
        } else {
          current.quantity = Math.max(current.quantity, item.quantity)
        }
      }

      for (const [nameKey, itemData] of deduplicatedItems) {
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === nameKey
        )

        if (existing) {
          // Only update if quantity needs to be increased
          if (itemData.quantity > existing.quantity) {
            dbOperations.push(
              prisma.packingItem.update({
                where: { id: existing.id },
                data: { quantity: itemData.quantity },
              })
            )
            // Update in-memory in case it's checked again (not strictly necessary here but good practice)
            existing.quantity = itemData.quantity
          }
        } else {
          maxItemOrder += 1
          dbOperations.push(
            prisma.packingItem.create({
              data: {
                categoryId: category.id,
                name: itemData.name,
                quantity: itemData.quantity,
                isPacked: false,
                isCustom: true,
                packLast: false,
                order: maxItemOrder,
              },
            })
          )
          synced++
        }
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
