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
    // Why: Replaced deeply nested Cartesian product query with two flat queries using `groupBy` and `_sum`.
    // Impact: Avoids loading entire item objects into memory just to calculate counts, reducing DB latency and Node.js memory footprint.

    // First query: Get categories to map IDs to names and determine order
    const categories = await prisma.category.findMany({
      where: { packingList: { tripId: id } },
      select: { id: true, name: true, order: true },
      orderBy: { order: 'asc' }
    })

    const categoryIds = categories.map(c => c.id)

    // Second query: Get aggregated stats for only those categories
    // (Prisma groupBy does not support relation filters, so we use the categoryIds array)
    const itemStats = categoryIds.length > 0 ? await prisma.packingItem.groupBy({
      by: ['categoryId', 'isPacked'],
      where: { categoryId: { in: categoryIds } },
      _sum: { quantity: true }
    }) : []

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    // Initialize category tracking map
    const categoryMap = new Map(categories.map(c => [
      c.id,
      { name: c.name, total: 0, packed: 0 }
    ]))

    // Apply stats from grouping
    for (const stat of itemStats) {
      const cat = categoryMap.get(stat.categoryId)
      if (!cat) continue

      const qty = stat._sum.quantity || 0
      cat.total += qty
      total += qty

      if (stat.isPacked) {
        cat.packed += qty
        packed += qty
      }
    }

    // Preserve original category order
    categories.forEach(c => {
      const stats = categoryMap.get(c.id)
      if (stats) {
        byCategory.push(stats)
      }
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
