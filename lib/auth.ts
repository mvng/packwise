import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the Prisma User.id (not the Supabase auth UUID).
 * Priority:
 * 1. supabase.auth.getUser()  — validates JWT with Supabase API (most secure)
 * 2. supabase.auth.getSession() — reads local cookie, no network call
 * 3. guest_mode/guest_user_id cookie — for demo/guest users
 *
 * When a Supabase user is found, a Prisma User row is upserted so that
 * the FK constraints (which reference User.id) are satisfied.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  let authUser: any = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    authUser = user
  } catch {}

  if (!authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      authUser = session?.user ?? null
    } catch {}
  }

  if (authUser) {
    const prismaUser = await prisma.user.upsert({
      where: { supabaseId: authUser.id },
      create: {
        supabaseId: authUser.id,
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        authProvider: authUser.app_metadata?.provider ?? 'email',
      },
      update: {
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      },
    })
    return prismaUser.id
  }

  const cookieStore = await cookies()
  const isGuestMode = cookieStore.get('guest_mode')?.value === 'true'
  if (isGuestMode) {
    return cookieStore.get('guest_user_id')?.value ?? null
  }

  return null
}
