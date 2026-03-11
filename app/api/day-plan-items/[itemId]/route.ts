import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/day-plan-items/[itemId]
export async function DELETE(
  _req: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    await prisma.dayPlanItem.delete({ where: { id: params.itemId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/day-plan-items/[itemId] — move, reorder, or update notes/time
export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const body = await req.json()
  const { dayPlanId, order, notes } = body

  try {
    const item = await prisma.dayPlanItem.update({
      where: { id: params.itemId },
      data: {
        ...(dayPlanId != null ? { dayPlanId } : {}),
        ...(order != null ? { order } : {}),
        // notes stores the time string for inline tag items (e.g. '19:00')
        // explicitly allow null to clear the time
        ...('notes' in body ? { notes: notes ?? null } : {}),
      },
    })
    return NextResponse.json({ item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
