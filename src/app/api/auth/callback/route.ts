import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { buildAuthErrorRedirectUrl } from '@/lib/auth-errors'
import { isValidThaiPhone, generateCustomerCode } from '@/lib/phone'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/dashboard')
  const isPasswordRecovery = next.startsWith('/reset-password') || type === 'recovery'

  if (code || (tokenHash && type)) {
    const supabase = await createClient()
    let authError: any = null

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      authError = error
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })
      authError = error
    }
    
    if (!authError) {
      // Create user profile if it doesn't exist
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Extract LINE ID if they logged in via LINE
        const lineIdentity = user.identities?.find((i: any) => i.provider === 'custom:line' || i.provider === 'line')
        const lineUid = lineIdentity?.identity_data?.sub || lineIdentity?.id || null

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, phone')
          .eq('id', user.id)
          .maybeSingle()

        let hasPhone = isValidThaiPhone(profile?.phone)

        if (!profile) {
          // Auto-generate customer code for new OAuth users
          const customerCode = generateCustomerCode()
          
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Member',
            role: 'CUSTOMER',
            customer_code: customerCode,
            is_active: true,
            line_uid: lineUid
          })
          hasPhone = false
        } else if (lineUid) {
          // Update existing profile with LINE UID if available
          await supabase.from('profiles').update({ line_uid: lineUid }).eq('id', user.id)
        }

        // Always allow password recovery to reach /reset-password first
        if (isPasswordRecovery) {
          return NextResponse.redirect(`${origin}/reset-password`)
        }

        if (!hasPhone) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error("Auth callback error:", authError)
    if (isPasswordRecovery) {
      return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
    }
    return NextResponse.redirect(buildAuthErrorRedirectUrl(origin))
  }

  const providerError = searchParams.get('error')
  if (providerError) {
    if (isPasswordRecovery) {
      return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
    }
    return NextResponse.redirect(buildAuthErrorRedirectUrl(origin, providerError))
  }

  if (isPasswordRecovery) {
    return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
  }

  return NextResponse.redirect(buildAuthErrorRedirectUrl(origin))
}
