import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: resolvedParams.id },
      select: { name: true, destination: true },
    })

    if (!trip) {
      return {
        title: 'Trip Not Found | Packwise',
        description: 'The packing list you are looking for could not be found.',
      }
    }

    const titleName = trip.name || trip.destination || 'Untitled Trip'
    const title = `${titleName} Packing List | Packwise`
    const description = trip.destination
      ? `Check out the packing list for ${trip.destination}. Organized and ready for the trip!`
      : `Check out this packing list on Packwise. Organized and ready for the trip!`

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
      title: 'Packwise – Smart Packing Lists',
      description: 'Create smart packing lists for every trip.',
    }
  }
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
