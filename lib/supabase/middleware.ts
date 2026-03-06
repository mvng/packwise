import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check for guest mode query parameter
  const guestMode = request.nextUrl.searchParams.get('guest') === 'true'
  const hasGuestCookie = request.cookies.get('guest_mode')?.value === 'true'

  // If guest mode is enabled, set a cookie and skip auth
  if (guestMode || hasGuestCookie) {
    supabaseResponse.cookies.set('guest_mode', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
    })
    return supabaseResponse
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Refresh session if expired - required for Server Components
  // This ensures the session cookies are updated and persisted
  const { data: { user } } = await supabase.auth.getUser()

  // Optional: redirect to login if accessing protected routes without auth
  // Uncomment if you want server-side protection:
  // if (
  //   !user &&
  //   !request.nextUrl.pathname.startsWith('/login') &&
  //   !request.nextUrl.pathname.startsWith('/auth') &&
  //   !request.nextUrl.pathname.startsWith('/_next') &&
  //   !request.nextUrl.pathname.startsWith('/api')
  // ) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/login'
  //   return NextResponse.redirect(url)
  // }

  return supabaseResponse
}
