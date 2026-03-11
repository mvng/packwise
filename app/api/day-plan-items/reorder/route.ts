import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/day-plan-items/reorder
export async function POST(req: Request) {
  const body = await req.json()
  const { orderedIds } = body

  try {
    await prisma.$transaction(
      (orderedIds as string[]).map((id: string, index: number) =>
        prisma.dayPlanItem.update({ where: { id }, data: { order: index } })
      )
    )
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
