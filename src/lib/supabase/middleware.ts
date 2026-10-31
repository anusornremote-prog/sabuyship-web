import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const { data: { user } } = await supabase.auth.getUser()

  let role = 'CUSTOMER'
  let isActive = true
  
  // Only query the profile role if we need to make a routing decision based on it
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname === '/login' || pathname === '/register' || pathname === '/complete-profile')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, phone, is_active')
      .eq('id', user.id)
      .maybeSingle()
    
    if (profileError) {
      console.error("Middleware Profile Query Error:", profileError)
    }
    
    role = profile?.role || 'CUSTOMER'
    isActive = profile?.is_active !== false
  }

  const createRedirectResponse = (url: string) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Route Guards
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return createRedirectResponse('/login')
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return createRedirectResponse('/login')
    }
    if (role !== 'ADMIN' || !isActive) {
      return createRedirectResponse('/dashboard')
    }
  }

  if (pathname === '/complete-profile') {
    if (!user) {
      return createRedirectResponse('/login')
    }
    // Redirect to dashboard where the mandatory PhoneSetupModal popup is displayed
    const dest = role === 'ADMIN' ? '/admin' : '/dashboard'
    return createRedirectResponse(dest)
  }

  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      const dest = role === 'ADMIN' ? '/admin' : '/dashboard'
      return createRedirectResponse(dest)
    }
  }

  return supabaseResponse
}
