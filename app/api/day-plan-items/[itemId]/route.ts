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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

import { extractAssigneeName, findOrCreateTripMember } from '@/lib/assignee-parser'

// PATCH /api/day-plan-items/[itemId] — move, reorder, or update notes/time, or assignees
export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const body = await req.json()
  const { dayPlanId, order, notes, name } = body

  try {
    let parsedName = name
    let assigneeId: string | null | undefined = undefined

    if (name) {
      const extracted = extractAssigneeName(name)
      if (extracted) {
        parsedName = extracted.cleanText || extracted.name

        // We need the tripId to create/find a member. Let's get it from the item's dayPlan
        const existingItem = await prisma.dayPlanItem.findUnique({
          where: { id: params.itemId },
          include: { dayPlan: true }
        })

        if (existingItem?.dayPlan?.tripId) {
           const member = await findOrCreateTripMember(existingItem.dayPlan.tripId, extracted.name)
           assigneeId = member.id
        }
      }
    }

    const item = await prisma.dayPlanItem.update({
      where: { id: params.itemId },
      data: {
        ...(dayPlanId != null ? { dayPlanId } : {}),
        ...(order != null ? { order } : {}),
        ...(parsedName != null ? { name: parsedName } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        // notes stores the time string for inline tag items (e.g. '19:00')
        // explicitly allow null to clear the time
        ...('notes' in body ? { notes: notes ?? null } : {}),
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
