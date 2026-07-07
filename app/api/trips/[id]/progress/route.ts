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
    // Why: Replaced deeply nested Cartesian 'include' with parallel optimized queries using 'groupBy' and '_sum'.
    // Impact: Prevents N+1 database explosions and large payload bloat by offloading counting to the DB.
    const categories = await prisma.category.findMany({
      where: { packingList: { tripId: id } },
      select: { id: true, name: true }
    });

    const categoryIds = categories.map(c => c.id);

    const itemAggregations = categoryIds.length > 0 ? await prisma.packingItem.groupBy({
      by: ['categoryId', 'isPacked'],
      where: { categoryId: { in: categoryIds } },
      _sum: { quantity: true }
    }) : [];

    // Optimize aggregations matching using a dictionary lookup O(N+M)
    const statsByCategoryId = new Map<string, { total: number, packed: number }>();

    itemAggregations.forEach(agg => {
      const catId = agg.categoryId;
      const qty = agg._sum.quantity || 0;

      if (!statsByCategoryId.has(catId)) {
        statsByCategoryId.set(catId, { total: 0, packed: 0 });
      }

      const stats = statsByCategoryId.get(catId)!;
      stats.total += qty;
      if (agg.isPacked) {
        stats.packed += qty;
      }
    });

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    categories.forEach(category => {
      const stats = statsByCategoryId.get(category.id) || { total: 0, packed: 0 };

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
