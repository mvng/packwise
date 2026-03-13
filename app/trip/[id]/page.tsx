import { notFound } from 'next/navigation'
import { getSharedTripById } from '@/actions/trip.actions'
import { getTripWeather } from '@/actions/weather.actions'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import TripWeather from '@/components/TripWeather'
import TripWeatherSkeleton from '@/components/TripWeatherSkeleton'
import TripPageClient from './TripPageClient'

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
