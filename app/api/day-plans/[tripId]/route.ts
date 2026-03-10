import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const { tripId } = params

  try {
    const dayPlans = await prisma.dayPlan.findMany({
      where: { tripId },
      orderBy: { date: 'asc' },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    })
    return NextResponse.json({ dayPlans })
  } catch (error: any) {
    console.error('getDayPlansForTrip API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch day plans' },
      { status: 500 }
    )
  }
}
