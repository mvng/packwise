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
      include: { items: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ dayPlans })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const { tripId } = params
  const body = await req.json()
  const { date, label } = body

  try {
    const normalizedDate = new Date(date)
    normalizedDate.setUTCHours(0, 0, 0, 0)
    const nextDay = new Date(normalizedDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)

    const existing = await prisma.dayPlan.findFirst({
      where: { tripId, date: { gte: normalizedDate, lt: nextDay } },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    if (existing) {
      const dayPlan = await prisma.dayPlan.update({
        where: { id: existing.id },
        data: { label: label ?? existing.label },
        include: { items: { orderBy: { order: 'asc' } } },
      })
      return NextResponse.json({ dayPlan })
    }

    const dayPlan = await prisma.dayPlan.create({
      data: { tripId, date: normalizedDate, label: label ?? null },
      include: { items: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ dayPlan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
