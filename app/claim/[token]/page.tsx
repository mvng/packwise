import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimPageClient from './ClaimPageClient'

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
