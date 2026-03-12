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

      const existingItems = await prisma.packingItem.findMany({
        where: { categoryId: category.id },
        orderBy: { order: 'desc' },
      })
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1)

      for (const item of items) {
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        )
        if (existing) {
          await prisma.packingItem.update({
            where: { id: existing.id },
            data: { quantity: Math.max(existing.quantity, item.quantity) },
          })
        } else {
          maxItemOrder += 1
          await prisma.packingItem.create({
            data: {
              categoryId: category.id,
              name: item.name,
              quantity: item.quantity,
              isPacked: false,
              isCustom: true,
              packLast: false,
              order: maxItemOrder,
            },
          })
          synced++
        }
      }
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
