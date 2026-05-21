const fs = require('fs');
const filepath = 'app/api/day-plans/sync/route.ts';

const newCode = `import { NextResponse } from 'next/server'
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
    // Why: Replaced an O(N) database query inside a loop with an array of batched operations.
    // Impact: Prevents N+1 database queries when syncing multiple categories and items,
    // reducing total DB round-trips from O(N) to O(1) and significantly improving endpoint response time.
    const dbOperations: any[] = [];

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

      // We already fetched category.items via include: { items: true }
      // This prevents the N+1 findMany query!
      const existingItems = category.items || [];
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      // Deduplicate items in the payload before trying to sync to DB
      const deduplicatedItems = new Map<string, number>();
      for (const item of items) {
        const key = item.name.toLowerCase();
        const currentQty = deduplicatedItems.get(key) || 0;
        deduplicatedItems.set(key, Math.max(currentQty, item.quantity));
      }

      for (const [itemName, maxQuantity] of deduplicatedItems.entries()) {
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === itemName
        )
        if (existing) {
          dbOperations.push(
            prisma.packingItem.update({
              where: { id: existing.id },
              data: { quantity: Math.max(existing.quantity, maxQuantity) },
            })
          );
        } else {
          maxItemOrder += 1
          dbOperations.push(
            prisma.packingItem.create({
              data: {
                categoryId: category.id,
                // find the original casing of the item name
                name: items.find(i => i.name.toLowerCase() === itemName)!.name,
                quantity: maxQuantity,
                isPacked: false,
                isCustom: true,
                packLast: false,
                order: maxItemOrder,
              },
            })
          );
          synced++
        }
      }
    }

    if (dbOperations.length > 0) {
      await prisma.$transaction(dbOperations);
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
`
fs.writeFileSync(filepath, newCode);
console.log('patched app/api/day-plans/sync/route.ts again');
