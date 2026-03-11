import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Eagerly upsert the Prisma User row on login so the Trip.userId FK
    // constraint is always satisfied before the user hits any server action.
    if (data?.user) {
      try {
        await prisma.user.upsert({
          where: { supabaseId: data.user.id },
          create: {
            supabaseId: data.user.id,
            email: data.user.email ?? '',
            name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
            authProvider: data.user.app_metadata?.provider ?? 'email',
          },
          update: {
            email: data.user.email ?? '',
            name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
            avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          },
        })
      } catch (e) {
        // Non-fatal: getUserId() will retry the upsert on the next action call
        console.error('Failed to upsert user on auth callback:', e)
      }
    }
  }

  redirect('/dashboard')
}
