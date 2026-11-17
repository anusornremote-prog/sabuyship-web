import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { buildAuthErrorRedirectUrl, getAuthCallbackErrorCode } from '@/lib/auth-errors'
import { isValidThaiPhone, generateCustomerCode } from '@/lib/phone'
import { getCustomerDisplayName } from '@/lib/display-name'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  // Sanitize relative redirect target to prevent open redirects
  const rawNext = searchParams.get('next')
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard'
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : defaultNext
  const isPasswordRecovery = next.startsWith('/reset-password') || type === 'recovery'
  const isProfileLinkFlow = next.startsWith('/dashboard/profile')

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
          
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: getCustomerDisplayName({
              userMetadata: user.user_metadata,
              email: user.email,
              phone: user.phone,
              fallback: 'Member',
            }),
            role: 'CUSTOMER',
            customer_code: customerCode,
            is_active: true,
            line_uid: lineUid
          })
          if (insertError) {
            console.error("Auth callback profile insert error:", {
              code: insertError.code,
              message: insertError.message,
            })
          }
          hasPhone = false
        } else if (lineUid) {
          // Update existing profile with LINE UID if available
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ line_uid: lineUid })
            .eq('id', user.id)
          if (updateError) {
            console.error("Auth callback profile line_uid update error:", {
              code: updateError.code,
              message: updateError.message,
            })
          }
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
    
    console.error("Auth callback code exchange error:", {
      message: authError?.message,
      status: authError?.status,
      code: authError?.code,
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      isPasswordRecovery,
    })
    if (isPasswordRecovery) {
      return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
    }
    if (isProfileLinkFlow) {
      return NextResponse.redirect(`${origin}/dashboard/profile?line_error=AuthFailed`)
    }
    return NextResponse.redirect(buildAuthErrorRedirectUrl(origin))
  }

  const providerError = searchParams.get('error')
  if (providerError) {
    console.error("Auth callback provider error:", {
      providerError,
      errorCode: searchParams.get('error_code'),
      isPasswordRecovery,
    })
    if (isPasswordRecovery) {
      return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
    }
    if (isProfileLinkFlow) {
      return NextResponse.redirect(
        `${origin}/dashboard/profile?line_error=${getAuthCallbackErrorCode(providerError)}`
      )
    }
    return NextResponse.redirect(buildAuthErrorRedirectUrl(origin, providerError))
  }

  if (isPasswordRecovery) {
    return NextResponse.redirect(`${origin}/forgot-password?error=ResetLinkExpired`)
  }

  console.error("Auth callback invoked without code or error params", {
    isPasswordRecovery,
  })
  return NextResponse.redirect(buildAuthErrorRedirectUrl(origin))
}
