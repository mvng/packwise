import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if trip belongs to user
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        user: { supabaseId: user.id }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 })
    }

    const tasks = await prisma.tripTask.findMany({
      where: { tripId: id },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching trip tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Find Prisma user to attach to task
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    })

    if (!prismaUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if trip belongs to user
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: prismaUser.id
      }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { title, notes, category, dueDate, reminderAt, reminderTypes } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const task = await prisma.tripTask.create({
      data: {
        tripId: id,
        userId: prismaUser.id,
        title,
        notes,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        reminderTypes: reminderTypes || [],
        status: 'PENDING'
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating trip task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
