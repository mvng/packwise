import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTripCalendarFeed } from '@/lib/calendar'

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

    if (!trip || !trip.startDate || !trip.endDate) {
      return new NextResponse('Trip not found or missing dates', { status: 404 })
    }

    // Base URL of the app
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host')
    const appUrl = `${protocol}://${host}`

    const icsContent = generateTripCalendarFeed({
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      packingLists: trip.packingLists
    }, appUrl)

    return new NextResponse(icsContent, {
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
