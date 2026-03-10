import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { tripId, supabaseUserId } = await request.json()

    if (!tripId || !supabaseUserId) {
      return NextResponse.json({ isOwner: false })
    }

    // Get Prisma user from Supabase ID
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
      select: { id: true }
    })

    if (!prismaUser) {
      return NextResponse.json({ isOwner: false })
    }

    // Check if trip belongs to this user
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: prismaUser.id
      },
      select: { id: true }
    })

    return NextResponse.json({ isOwner: !!trip })
  } catch (error) {
    console.error('Check ownership error:', error)
    return NextResponse.json({ isOwner: false })
  }
}
