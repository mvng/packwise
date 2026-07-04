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
    // Why: Replaced deeply nested `include: { items: true }` which fetches all items into memory
    // Impact: Uses parallel `groupBy` queries to let the database handle the aggregation (counts/sums) directly,
    // avoiding the Cartesian product and eliminating the large data transfer & memory bloat.

    const [totalAgg, packedAgg] = await Promise.all([
      prisma.packingItem.groupBy({
        by: ['categoryId'],
        where: { category: { packingList: { tripId: id } } },
        _sum: { quantity: true },
      }),
      prisma.packingItem.groupBy({
        by: ['categoryId'],
        where: { category: { packingList: { tripId: id } }, isPacked: true },
        _sum: { quantity: true },
      }),
    ])

    const totalMap = new Map(totalAgg.map(a => [a.categoryId, a._sum.quantity || 0]))
    const packedMap = new Map(packedAgg.map(a => [a.categoryId, a._sum.quantity || 0]))

    // Only fetch category names without their items
    const categories = await prisma.category.findMany({
      where: { packingList: { tripId: id } },
      select: { id: true, name: true }
    })

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    categories.forEach(category => {
      const catTotal = totalMap.get(category.id) || 0
      const catPacked = packedMap.get(category.id) || 0

      total += catTotal
      packed += catPacked

      byCategory.push({
        name: category.name,
        total: catTotal,
        packed: catPacked
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
