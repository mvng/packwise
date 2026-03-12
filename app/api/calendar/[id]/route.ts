import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEvents, EventAttributes } from 'ics'
import dayjs from 'dayjs'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        packingLists: {
          include: {
            categories: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    })

    if (!trip) {
      return new NextResponse('Trip not found', { status: 404 })
    }

    const start = dayjs(trip.startDate)
    const end = dayjs(trip.endDate).add(1, 'day') // Add 1 day for all-day events in ICS to include the end date

    // Count items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allItems = trip.packingLists.flatMap((list: any) => list.categories.flatMap((cat: any) => cat.items))
    const totalItems = allItems.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packedItems = allItems.filter((item: any) => item.isPacked).length

    // Base URL of the app
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host')
    const appUrl = `${protocol}://${host}`
    const tripUrl = `${appUrl}/trip/${trip.id}`

    let description = `🧳 Trip: ${trip.name || trip.destination}\n`
    if (trip.destination) description += `📍 Destination: ${trip.destination}\n`
    description += `\n📦 Packing Progress: ${packedItems}/${totalItems} items packed\n`
    description += `\n🔗 View & Pack: ${tripUrl}`

    const tripEvent: EventAttributes = {
      start: [start.year(), start.month() + 1, start.date()], // month is 1-indexed in ics
      end: [end.year(), end.month() + 1, end.date()],
      title: `✈️ ${trip.name || trip.destination}`,
      description: description,
      location: trip.destination,
      url: tripUrl,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      alarms: [
        {
          action: 'display',
          description: `Reminder: Pack for your trip to ${trip.destination}!`,
          trigger: { days: 2, before: true } // 2 days before trip
        },
        {
          action: 'display',
          description: `Reminder: Double check your packing list for ${trip.destination}!`,
          trigger: { hours: 12, before: true } // 12 hours before trip
        }
      ]
    }

    const { error, value } = createEvents([tripEvent])

    if (error || !value) {
      console.error('Error generating ICS:', error)
      return new NextResponse('Error generating calendar data', { status: 500 })
    }

    return new NextResponse(value, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="trip-${trip.id}.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Calendar generation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
