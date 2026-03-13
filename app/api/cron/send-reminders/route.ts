import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import twilio from 'twilio'
import ical from 'ical-generator'

export async function GET(request: NextRequest) {
  // Validate the CRON_SECRET to ensure only Vercel can run this task
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const tasks = await prisma.tripTask.findMany({
      where: {
        status: 'PENDING',
        reminderSentAt: null,
        reminderAt: {
          lte: now
        }
      },
      include: {
        user: true,
        trip: true
      }
    })

    console.log(`Processing ${tasks.length} reminders...`)

    for (const task of tasks) {
      const { reminderTypes } = task

      if (reminderTypes.includes('PUSH')) {
        console.log(`[PUSH] Web Push notification for task: ${task.title}`)
        // TODO: Get VAPID keys and user's push subscription from DB
      }

      if (reminderTypes.includes('SMS')) {
        if (task.user.phone) {
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
            try {
              const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
              await client.messages.create({
                body: `Packwise Reminder: ${task.title} for your trip to ${task.trip.destination}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: task.user.phone
              })
              console.log(`[SMS] Sent to ${task.user.phone} for task: ${task.title}`)
            } catch (err) {
              console.error(`[SMS] Failed to send SMS to ${task.user.phone}:`, err)
            }
          } else {
            console.log(`[SMS] Twilio env vars missing. Stubbed sending SMS to ${task.user.phone} for task: ${task.title}`)
          }
        } else {
          console.log(`[SMS] No phone number for user. Stubbed for task: ${task.title}`)
        }
      }

      if (reminderTypes.includes('CALENDAR')) {
        const calendar = ical({ name: 'Packwise Reminders' })
        calendar.createEvent({
          start: task.dueDate || task.reminderAt || now,
          end: new Date((task.dueDate || task.reminderAt || now).getTime() + 60 * 60 * 1000),
          summary: `Packwise: ${task.title}`,
          description: `Reminder for your trip to ${task.trip.destination}. ${task.notes || ''}`
        })
        const calendarLink = calendar.toString()
        console.log(`[CALENDAR] Calendar invite generated for task: ${task.title}`)
      }

      // Mark as sent
      await prisma.tripTask.update({
        where: { id: task.id },
        data: { reminderSentAt: now }
      })
    }

    return NextResponse.json({ success: true, processed: tasks.length })
  } catch (error) {
    console.error('Error in send-reminders cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
