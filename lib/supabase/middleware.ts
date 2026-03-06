import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check for guest mode query parameter or existing cookie
  const guestMode = request.nextUrl.searchParams.get('guest') === 'true'
  const hasGuestCookie = request.cookies.get('guest_mode')?.value === 'true'

  // Set/renew the guest_mode cookie if needed, but do NOT return early.
  // We must still run the Supabase session refresh below so that auth tokens
  // stay valid for users who are (or later become) logged in.
  if (guestMode || hasGuestCookie) {
    supabaseResponse.cookies.set('guest_mode', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          // Re-apply the guest_mode cookie since we just created a new response
          if (guestMode || hasGuestCookie) {
            supabaseResponse.cookies.set('guest_mode', 'true', {
              path: '/',
              maxAge: 60 * 60 * 24 * 7,
              httpOnly: true,
              sameSite: 'lax',
            })
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always refresh the session, even in guest mode.
  // This keeps auth tokens valid for logged-in users and is a no-op for guests.
  await supabase.auth.getUser()

  return supabaseResponse
}
