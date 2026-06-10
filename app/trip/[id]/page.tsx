import { notFound } from 'next/navigation'
import { getSharedTripById } from '@/actions/trip.actions'
import { getTripWeather } from '@/actions/weather.actions'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import TripWeather from '@/components/TripWeather'
import TripWeatherSkeleton from '@/components/TripWeatherSkeleton'
import TripPageClient from './TripPageClient'

import type { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Adding dynamic metadata to the trip page ensures that if a user decides to share
// their trip URL, the Open Graph preview accurately reflects the trip destination
// and context, significantly improving click-through rates.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params

  try {
    const tripResponse = await getSharedTripById(resolvedParams.id)
    const trip = tripResponse?.trip

    if (!trip) {
      return {
        title: 'Trip Details | Packwise',
        description: 'View trip details and packing lists on Packwise.',
      }
    }

    const titleName = trip.name || trip.destination || 'Untitled Trip'
    const title = `${titleName} | Packwise Trip`
    const description = trip.destination
      ? `View the packing list and details for ${trip.destination} on Packwise.`
      : `View trip details and packing lists on Packwise.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    }
  } catch (error) {
    return {
      title: 'Trip Details | Packwise',
      description: 'View trip details and packing lists on Packwise.',
    }
  }
}


export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()

  const [authResponse, tripResponse] = await Promise.all([
    supabase.auth.getUser(),
    getSharedTripById(id)
  ])

  const user = authResponse.data.user
  const fetchedTrip = tripResponse.trip

  if (tripResponse.error || !fetchedTrip) {
    return notFound()
  }

  let isOwner = false
  if (user) {
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true }
    })
    isOwner = fetchedTrip.userId === prismaUser?.id
  }

  let tripTimezone: string | null = null
  let weatherComponent = null

  if (fetchedTrip.destination && fetchedTrip.startDate && fetchedTrip.endDate) {
    const { weather } = await getTripWeather(fetchedTrip.destination, fetchedTrip.startDate, fetchedTrip.endDate)
    if (weather?.timezone) {
      tripTimezone = weather.timezone
    }

    weatherComponent = (
      <Suspense fallback={<TripWeatherSkeleton variant="detail" />}>
        <TripWeather
          destination={fetchedTrip.destination}
          startDate={fetchedTrip.startDate}
          endDate={fetchedTrip.endDate}
          variant="detail"
        />
      </Suspense>
    )
  }

  return (
    <TripPageClient
      initialTrip={fetchedTrip}
      user={user}
      isOwner={isOwner}
      initialTripTimezone={tripTimezone}
      weatherComponent={weatherComponent}
    />
  )
}
