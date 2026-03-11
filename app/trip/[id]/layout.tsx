import type { Metadata, ResolvingMetadata } from 'next'
import { getSharedTripById } from '@/actions/trip.actions'
import { formatDate } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
}

// 💡 SEO Rationale: This Layout component is specifically added to provide server-side
// dynamic metadata for trip pages because `app/trip/[id]/page.tsx` is a Client Component
// ('use client'). By placing `generateMetadata` in a server component (layout), crawlers
// and social media platforms can correctly scrape the trip details for Open Graph tags,
// improving shareability and CTR when a trip URL is shared.
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const id = resolvedParams.id

  const { trip } = await getSharedTripById(id)

  if (!trip) {
    return {
      title: 'Trip Not Found | Packwise',
      description: 'The requested trip could not be found.',
    }
  }

  const tripName = trip.name || trip.destination || 'My Trip'
  const title = `${tripName} | Packwise`

  // Construct a descriptive metadata description
  let description = `Packing list and plans for ${tripName}`
  if (trip.destination) {
    description += ` to ${trip.destination}`
  }
  if (trip.startDate) {
    description += ` starting ${formatDate(trip.startDate as unknown as string)}`
  }
  description += '.'

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
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
