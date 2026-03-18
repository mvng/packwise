import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimPageClient from './ClaimPageClient'

import type { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Adding dynamic metadata to the claim page ensures that when users share this link
// via social media or messaging apps, the Open Graph preview accurately reflects
// the trip destination and context, significantly improving click-through rates.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const resolvedParams = await params

  try {
    const list = await prisma.packingList.findUnique({
      where: { shareToken: resolvedParams.token },
      include: {
        trip: {
          select: { name: true, destination: true },
        },
      },
    })

    if (!list || !list.trip) {
      return {
        title: 'Shared Packing List | Packwise',
        description: 'Join this shared packing list on Packwise.',
      }
    }

    const titleName = list.name || list.trip.name || list.trip.destination || 'Untitled Trip'
    const title = `Join the Packing List for ${titleName} | Packwise`
    const description = list.trip.destination
      ? `Join the shared packing list for ${list.trip.destination}. Claim the items you're bringing!`
      : `Join this shared packing list on Packwise. Claim the items you're bringing!`

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
      description: 'Join this shared packing list on Packwise.',
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
