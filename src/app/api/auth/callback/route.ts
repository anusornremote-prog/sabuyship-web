import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Create user profile if it doesn't exist
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Extract LINE ID if they logged in via LINE
        const lineIdentity = user.identities?.find((i: any) => i.provider === 'custom:line' || i.provider === 'line')
        const lineUid = lineIdentity?.identity_data?.sub || lineIdentity?.id || null

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Auto-generate customer code for new OAuth users
          const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
          const customerCode = `SB${randomChars}`
          
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member',
            role: 'CUSTOMER',
            customer_code: customerCode,
            is_active: true,
            line_uid: lineUid
          })
        } else if (lineUid) {
          // Update existing profile with LINE UID if available
          await supabase.from('profiles').update({ line_uid: lineUid }).eq('id', user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error("Auth callback error:", error)
  }

  // Return the user to login with an error
  return NextResponse.redirect(`${origin}/login?error=AuthFailed`)
}
