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
    // Why: Flattened Cartesian product Prisma query into parallel aggregate queries.
    // Replaced `include: { items: true }` with a fast O(1) memory map built from grouped sums.
    // Impact: Avoids N+1 memory bloat and speeds up progress calculation.
    const [categories, itemsAggregates] = await Promise.all([
      prisma.category.findMany({
        where: { packingList: { tripId: id } },
        select: { id: true, name: true }
      }),
      prisma.packingItem.groupBy({
        by: ['categoryId', 'isPacked'],
        where: { category: { packingList: { tripId: id } } },
        _sum: { quantity: true }
      })
    ]);

    const aggregatesMap = new Map<string, { total: number, packed: number }>();

    itemsAggregates.forEach(agg => {
      const catId = agg.categoryId;
      const quantity = agg._sum.quantity || 0;

      if (!aggregatesMap.has(catId)) {
        aggregatesMap.set(catId, { total: 0, packed: 0 });
      }

      const stats = aggregatesMap.get(catId)!;
      stats.total += quantity;

      if (agg.isPacked) {
        stats.packed += quantity;
      }
    });

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    categories.forEach(category => {
      const stats = aggregatesMap.get(category.id) || { total: 0, packed: 0 };

      total += stats.total;
      packed += stats.packed;

      byCategory.push({
        name: category.name,
        total: stats.total,
        packed: stats.packed
      })
    })

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
