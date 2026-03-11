import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/day-plan-items — add item to a day plan
export async function POST(req: Request) {
  const body = await req.json()
  const { dayPlanId, name, category, quantity, notes } = body

  try {
    const last = await prisma.dayPlanItem.findFirst({
      where: { dayPlanId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.dayPlanItem.create({
      data: {
        dayPlanId,
        name,
        category: category ?? null,
        quantity: quantity ?? 1,
        notes: notes ?? null,
        order: (last?.order ?? -1) + 1,
      },
    })
    return NextResponse.json({ item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
