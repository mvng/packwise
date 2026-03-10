import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { dayPlanId } = body

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prismaUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!prismaUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const dayPlan = await prisma.dayPlan.findUnique({
      where: { id: dayPlanId },
      include: { items: true, trip: true },
    })
    if (!dayPlan) return NextResponse.json({ error: 'Day plan not found' }, { status: 404 })
    if (dayPlan.trip.userId !== prismaUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    let saved = 0
    for (const item of dayPlan.items) {
      const catName = item.category ?? 'General'
      let invCategory = await prisma.inventoryCategory.findFirst({
        where: { userId: prismaUser.id, name: { equals: catName, mode: 'insensitive' } },
      })
      if (!invCategory) {
        const lastCat = await prisma.inventoryCategory.findFirst({
          where: { userId: prismaUser.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        invCategory = await prisma.inventoryCategory.create({
          data: { userId: prismaUser.id, name: catName, order: (lastCat?.order ?? -1) + 1 },
        })
      }
      const existing = await prisma.inventoryItem.findFirst({
        where: { categoryId: invCategory.id, name: { equals: item.name, mode: 'insensitive' } },
      })
      if (!existing) {
        const lastItem = await prisma.inventoryItem.findFirst({
          where: { categoryId: invCategory.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        await prisma.inventoryItem.create({
          data: {
            categoryId: invCategory.id,
            name: item.name,
            quantity: item.quantity,
            notes: item.notes ?? null,
            isFavorite: false,
            order: (lastItem?.order ?? -1) + 1,
          },
        })
        saved++
      }
    }
    return NextResponse.json({ saved })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
