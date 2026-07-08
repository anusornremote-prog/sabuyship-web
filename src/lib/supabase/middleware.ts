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
  let hasPhone = false
  
  // Only query the profile role if we need to make a routing decision based on it
  if (user && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname === '/login' || pathname === '/register')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, phone')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Middleware Profile Query Error:", profileError)
    }
    
    
    role = profile?.role || 'CUSTOMER'
    hasPhone = !!profile?.phone
  }

  // Route Guards
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!hasPhone) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (!hasPhone) {
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      const dest = role === 'ADMIN' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return supabaseResponse
}
