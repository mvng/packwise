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
    // Why: Batching Prisma writes for missing categories, updating existing items, and creating new items into single transactions
    // Impact: Massively reduces N+1 loop queries when syncing large day plans, improving DB write speeds.

    // 1. Create missing categories
    const categoriesToCreate = [];
    const catMap = new Map();
    for (const cat of existingCategories) {
      catMap.set(cat.name.toLowerCase(), cat);
    }

    for (const [catName] of grouped) {
      if (!catMap.has(catName.toLowerCase())) {
        maxCatOrder += 1;
        categoriesToCreate.push({
          packingListId: packingList.id,
          name: catName,
          order: maxCatOrder,
        });
      }
    }

    if (categoriesToCreate.length > 0) {
      await prisma.category.createMany({ data: categoriesToCreate });
      const newCats = await prisma.category.findMany({
        where: { packingListId: packingList.id, name: { in: categoriesToCreate.map(c => c.name) } }
      });
      for (const cat of newCats) {
        // Mock items array to match existingCategories structure
        catMap.set(cat.name.toLowerCase(), { ...cat, items: [] });
      }
    }

    const itemsToCreate = [];
    const updatePromises = [];

    // 2. Prepare items creates and updates
    for (const [catName, items] of grouped) {
      const category = catMap.get(catName.toLowerCase());
      if (!category) continue;

      const existingItems = category.items || [];
      let maxItemOrder = existingItems.reduce((max, i) => Math.max(max, i.order), -1);

      for (const item of items) {
        const existing = existingItems.find(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (existing) {
          updatePromises.push(
            prisma.packingItem.update({
              where: { id: existing.id },
              data: { quantity: Math.max(existing.quantity, item.quantity) },
            })
          );
        } else {
          maxItemOrder += 1;
          itemsToCreate.push({
            categoryId: category.id,
            name: item.name,
            quantity: item.quantity,
            isPacked: false,
            isCustom: true,
            packLast: false,
            order: maxItemOrder,
          });
          synced++;
        }
      }
    }

    // 3. Execute item writes efficiently
    if (itemsToCreate.length > 0) {
      await prisma.packingItem.createMany({ data: itemsToCreate });
    }
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }

    return NextResponse.json({ synced })
  } catch (error: unknown) {
    console.error('syncDayPlans error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
