import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractAssigneeName, findOrCreateTripMember } from '@/lib/assignee-parser'

// POST /api/day-plan-items — add item to a day plan
export async function POST(req: Request) {
  const body = await req.json()
  const { dayPlanId, name, category, quantity, notes } = body

  try {
    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id: dayPlanId },
      select: { tripId: true },
    })

    if (!dayPlan) {
      return NextResponse.json({ error: 'DayPlan not found' }, { status: 404 })
    }

    let parsedName = name
    let assigneeId: string | null = null

    const extracted = extractAssigneeName(name)
    if (extracted) {
      parsedName = extracted.cleanText || extracted.name // fallback to name if clean text is empty
      const member = await findOrCreateTripMember(dayPlan.tripId, extracted.name)
      assigneeId = member.id
    }

    const last = await prisma.dayPlanItem.findFirst({
      where: { dayPlanId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const item = await prisma.dayPlanItem.create({
      data: {
        dayPlanId,
        name: parsedName,
        category: category ?? null,
        quantity: quantity ?? 1,
        notes: notes ?? null,
        order: (last?.order ?? -1) + 1,
        assigneeId,
      },
      include: {
        assignee: true,
      }
    })
    return NextResponse.json({ item })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
