import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, taskId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, taskId } = params

    // Find Prisma user to attach to task
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    })

    if (!prismaUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if task exists and belongs to the user and the trip
    const existingTask = await prisma.tripTask.findFirst({
      where: {
        id: taskId,
        id,
        userId: prismaUser.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { title, notes, category, dueDate, reminderAt, reminderTypes, status } = body

    const dataToUpdate: any = {}

    if (title !== undefined) dataToUpdate.title = title
    if (notes !== undefined) dataToUpdate.notes = notes
    if (category !== undefined) dataToUpdate.category = category
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null
    if (reminderAt !== undefined) dataToUpdate.reminderAt = reminderAt ? new Date(reminderAt) : null
    if (reminderTypes !== undefined) dataToUpdate.reminderTypes = reminderTypes
    if (status !== undefined) dataToUpdate.status = status

    // If reminder settings change, reset reminderSentAt
    if (
      reminderAt !== undefined &&
      (existingTask.reminderAt?.getTime() !== (reminderAt ? new Date(reminderAt).getTime() : null))
    ) {
      dataToUpdate.reminderSentAt = null
    }

    const task = await prisma.tripTask.update({
      where: { id: taskId },
      data: dataToUpdate
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating trip task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, taskId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, taskId } = params

    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    })

    if (!prismaUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if task exists and belongs to the user and the trip
    const existingTask = await prisma.tripTask.findFirst({
      where: {
        id: taskId,
        id,
        userId: prismaUser.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
    }

    await prisma.tripTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
