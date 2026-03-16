import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimPageClient from './ClaimPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params

  try {
    const list = await prisma.packingList.findUnique({
      where: { shareToken: token },
      include: { trip: true },
    })

    if (!list) {
      return {
        title: 'Shared Packing List | Packwise',
        description: 'View and claim items on this shared packing list.',
      }
    }

    const titleName = list.trip?.name || list.trip?.destination || 'Untitled Trip'
    const title = `${titleName} Shared Packing List | Packwise`
    const description = list.trip?.destination
      ? `Join the packing list for ${list.trip.destination}. Claim items you're bringing and coordinate with your group!`
      : `Join this shared packing list on Packwise. Claim items you're bringing and coordinate with your group!`

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
      title: 'Shared Packing List | Packwise',
      description: 'View and claim items on this shared packing list.',
    }
  }
}

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const list = await prisma.packingList.findUnique({
    where: { shareToken: token },
    include: {
      trip: true,
      categories: {
        include: {
          items: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!list) {
    return notFound()
  }

  return (
    <ClaimPageClient list={list} token={token} />
  )
}
