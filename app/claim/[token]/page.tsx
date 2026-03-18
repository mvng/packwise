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
        title: 'Packing List Not Found | Packwise',
        description: 'The shared packing list you are looking for could not be found.',
      }
    }

    const titleName = list.name || list.trip?.name || list.trip?.destination || 'Shared Packing List'
    const title = `${titleName} | Packwise`
    const description = list.trip?.destination
      ? `Join the shared packing list for ${list.trip.destination}. Claim items you are bringing and collaborate on the trip!`
      : `Join this shared packing list on Packwise to claim items you are bringing.`

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
      description: 'Join this shared packing list on Packwise to claim items you are bringing.',
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
