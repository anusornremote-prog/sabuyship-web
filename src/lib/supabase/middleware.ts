import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getMockClient, isMockEnabled } from './mockClient'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  // 1. Handle Mock Mode
  if (isMockEnabled()) {
    const sessionCookie = request.cookies.get('sb-session')?.value
    const mockClient = getMockClient(sessionCookie)
    const { data: { user } } = await mockClient.auth.getUser()
    const role = user?.role || 'CUSTOMER'

    // Route Guards for Mock Mode
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
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

  // 2. Handle Real Supabase Mode
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
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log("Middleware Auth User ID:", user.id)
    console.log("Middleware Profile Data:", profile)
    if (profileError) {
      console.error("Middleware Profile Query Error:", profileError)
    }
    
    role = profile?.role || 'CUSTOMER'
  }

  // Route Guards for Real Mode
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
