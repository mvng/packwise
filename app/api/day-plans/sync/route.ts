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
    // Why: Eliminated N+1 queries by replacing in-loop item fetches with the already included
    // `category.items`, and batched all item creates/updates into a single transaction.
    // Impact: Reduces database roundtrips from potentially hundreds down to 1.
    const operations: any[] = []

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
        existingCategories.push(category)
      }

      const existingItems = category.items || []
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      // Deduplicate intra-batch items to prevent transaction write conflicts
      const itemMap = new Map<string, { quantity: number; originalName: string }>()
      for (const item of items) {
        const nameKey = item.name.toLowerCase()
        const currentQty = itemMap.get(nameKey)?.quantity || 0
        itemMap.set(nameKey, {
          quantity: Math.max(currentQty, item.quantity),
          originalName: item.name
        })
      }

      for (const [nameKey, { quantity, originalName }] of itemMap.entries()) {
        const existing = existingItems.find((i) => i.name.toLowerCase() === nameKey)
        if (existing) {
          const newQuantity = Math.max(existing.quantity, quantity)
          if (newQuantity > existing.quantity) {
            operations.push(
              prisma.packingItem.update({
                where: { id: existing.id },
                data: { quantity: newQuantity },
              })
            )
            existing.quantity = newQuantity
          }
        } else {
          maxItemOrder += 1
          operations.push(
            prisma.packingItem.create({
              data: {
                categoryId: category.id,
                name: originalName,
                quantity: quantity,
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

    if (operations.length > 0) {
      await prisma.$transaction(operations)
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
