import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimPageClient from './ClaimPageClient'
import type { Metadata } from 'next'

// SCOUT SEO RATIONALE:
// Adding dynamic metadata to the claim page ensures that when users share this link
// via social media or messaging apps, the Open Graph preview accurately reflects
// the trip destination and context, significantly improving click-through rates.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const list = await prisma.packingList.findUnique({
    where: { shareToken: token },
    include: { trip: true }
  })

  if (!list) {
    return {
      title: 'Shared Packing List | Packwise',
      description: 'Claim your shared packing list on Packwise.'
    }
  }

  const tripName = list.trip.name || list.trip.destination || 'A Trip'
  const title = `Claim Packing List: ${tripName} | Packwise`
  const description = `You have been invited to claim a packing list for ${tripName}. Packwise makes smart packing lists for every adventure.`

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
