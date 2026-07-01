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
    // Why: Replaced deeply nested `include` with parallel aggregation queries.
    // Impact: Eliminates Cartesian product data explosion and memory overhead.
    const [categories, itemStats] = await Promise.all([
      prisma.category.findMany({
        where: {
          packingList: {
            tripId: id
          }
        },
        select: {
          id: true,
          name: true
        }
      }),
      prisma.packingItem.groupBy({
        by: ['categoryId', 'isPacked'],
        where: {
          category: {
            packingList: {
              tripId: id
            }
          }
        },
        _sum: {
          quantity: true
        }
      })
    ])

    const statsByCategory = new Map<string, { total: number, packed: number }>()
    for (const stat of itemStats) {
      const quantity = stat._sum.quantity || 0
      if (!statsByCategory.has(stat.categoryId)) {
        statsByCategory.set(stat.categoryId, { total: 0, packed: 0 })
      }
      const categoryStats = statsByCategory.get(stat.categoryId)!
      categoryStats.total += quantity
      if (stat.isPacked) {
        categoryStats.packed += quantity
      }
    }

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    categories.forEach(category => {
      const stats = statsByCategory.get(category.id) || { total: 0, packed: 0 }
      const catTotal = stats.total
      const catPacked = stats.packed

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
