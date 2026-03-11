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

    const categories = await prisma.category.findMany({
      where: {
        packingList: {
          tripId: id
        }
      },
      include: {
        items: true
      }
    })

    let total = 0
    let packed = 0
    const byCategory: { name: string, total: number, packed: number }[] = []

    categories.forEach(category => {
      let catTotal = 0
      let catPacked = 0

      category.items.forEach(item => {
        catTotal += item.quantity
        if (item.isPacked) {
          catPacked += item.quantity
        }
      })

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
