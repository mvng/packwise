import { createEvents, EventAttributes } from 'ics'
import dayjs from 'dayjs'

interface CalendarTripInput {
  id: string
  name?: string | null
  destination?: string | null
  startDate: Date
  endDate: Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packingLists?: any[]
}

/**
 * Generates an iCalendar (.ics) feed string for a given trip.
 * This string can be returned in an API endpoint, sent as an email attachment,
 * or provided via a webcal:// link for calendar subscriptions.
 *
 * @param trip The trip data from Prisma
 * @param appBaseUrl The base URL of the app (e.g., https://packwise.app)
 * @returns The .ics file content as a string
 */
export function generateTripCalendarFeed(trip: CalendarTripInput, appBaseUrl: string): string {
  const start = dayjs(trip.startDate)
  const end = dayjs(trip.endDate).add(1, 'day') // Add 1 day for all-day events in ICS

  // Count items safely
  let totalItems = 0
  let packedItems = 0

  if (trip.packingLists) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allItems = trip.packingLists.flatMap((list: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (list.categories || []).flatMap((cat: any) => cat.items || [])
    )
    totalItems = allItems.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packedItems = allItems.filter((item: any) => item.isPacked).length
  }

  const tripUrl = `${appBaseUrl}/trip/${trip.id}`

  let description = `🧳 Trip: ${trip.name || trip.destination}\n`
  if (trip.destination) description += `📍 Destination: ${trip.destination}\n`

  if (totalItems > 0) {
    description += `\n📦 Packing Progress: ${packedItems}/${totalItems} items packed\n`
  }

  description += `\n🔗 View & Pack: ${tripUrl}`

  const tripEvent: EventAttributes = {
    start: [start.year(), start.month() + 1, start.date()], // month is 1-indexed in ics
    end: [end.year(), end.month() + 1, end.date()],
    title: `✈️ ${trip.name || trip.destination}`,
    description: description,
    location: trip.destination || undefined,
    url: tripUrl,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    alarms: [
      {
        action: 'display',
        description: `Reminder: Pack for your trip to ${trip.destination || trip.name}!`,
        trigger: { days: 2, before: true } // 2 days before trip
      },
      {
        action: 'display',
        description: `Reminder: Double check your packing list for ${trip.destination || trip.name}!`,
        trigger: { hours: 12, before: true } // 12 hours before trip
      }
    ]
  }

  const { error, value } = createEvents([tripEvent])

  if (error || !value) {
    console.error('Error generating ICS feed:', error)
    throw new Error('Failed to generate calendar events')
  }

  return value
}

/**
 * Returns a webcal:// URL that users can click to subscribe to the trip's calendar feed.
 *
 * @param tripId The ID of the trip
 * @param host The host domain (e.g., app.packwise.com)
 * @returns A webcal:// protocol link
 */
export function getCalendarSubscriptionUrl(tripId: string, host: string): string {
  // Strip protocol if it's there
  const cleanHost = host.replace(/^https?:\/\//, '')
  return `webcal://${cleanHost}/api/calendar/${tripId}`
}

/**
 * Returns a Google Calendar template URL for adding the event directly via web.
 * Note: This won't auto-sync updates, it's a one-time copy.
 */
export function getGoogleCalendarLink(trip: CalendarTripInput, appBaseUrl: string): string {
  const start = dayjs(trip.startDate).format('YYYYMMDD')
  const end = dayjs(trip.endDate).add(1, 'day').format('YYYYMMDD') // Add 1 day for all-day

  const text = encodeURIComponent(`✈️ ${trip.name || trip.destination}`)
  const dates = `${start}/${end}`

  let details = `🧳 Trip: ${trip.name || trip.destination}\n`
  if (trip.destination) details += `📍 Destination: ${trip.destination}\n`
  details += `\n🔗 View & Pack: ${appBaseUrl}/trip/${trip.id}`

  const encodedDetails = encodeURIComponent(details)
  const encodedLocation = encodeURIComponent(trip.destination || '')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${encodedDetails}&location=${encodedLocation}`
}
