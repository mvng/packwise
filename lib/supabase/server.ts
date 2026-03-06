import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // @supabase/ssr@0.1.0 stores the session as URL-encoded JSON.
          // Next.js returns the raw (still URL-encoded) cookie value from
          // the Cookie header. We must decode it before passing to the
          // Supabase client so JSON.parse() inside the library succeeds.
          return cookieStore.getAll().map(({ name, value }) => {
            try {
              return { name, value: decodeURIComponent(value) }
            } catch {
              return { name, value }
            }
          })
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
            // because the middleware handles session refresh
          }
        },
      },
    }
  )
}
