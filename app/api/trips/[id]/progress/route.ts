import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId
      },
      select: {
        id: true
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // ⚡ Bolt Performance Optimization
    // Why: Uses Prisma aggregations to offload N+1 data fetching and calculation to the database,
    // replacing memory-heavy deep includes and loops in Node.js
    // Impact: Massively reduces serialized payload sizes and prevents high memory usage from Cartesian products.
    const [categoriesResult, itemGroups] = await Promise.all([
      prisma.category.findMany({
        where: { packingList: { tripId: id } },
        select: { id: true, name: true }
      }),
      prisma.packingItem.groupBy({
        by: ['categoryId', 'isPacked'],
        where: { category: { packingList: { tripId: id } } },
        _sum: { quantity: true }
      })
    ])

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    const categoryMap = new Map<string, { total: number; packed: number }>();
    categoriesResult.forEach(cat => {
      categoryMap.set(cat.id, { total: 0, packed: 0 });
    });

    itemGroups.forEach(group => {
      const catData = categoryMap.get(group.categoryId);
      if (catData && group._sum.quantity) {
        catData.total += group._sum.quantity;
        if (group.isPacked) {
          catData.packed += group._sum.quantity;
        }
        total += group._sum.quantity;
        if (group.isPacked) {
          packed += group._sum.quantity;
        }
      }
    });

    categoriesResult.forEach(cat => {
      const data = categoryMap.get(cat.id);
      if (data) {
        byCategory.push({
          name: cat.name,
          total: data.total,
          packed: data.packed
        });
      }
    });

    const percentage = total === 0 ? 0 : Math.round((packed / total) * 100)

    return NextResponse.json({
      total,
      packed,
      percentage,
      byCategory
    })
  } catch (error: unknown) {
    console.error('Error fetching packing progress:', error)
    return NextResponse.json({ error: 'Failed to fetch packing progress' }, { status: 500 })
  }
}
