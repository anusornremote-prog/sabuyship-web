import { createBrowserClient } from '@supabase/ssr'
import { getMockClient, isMockEnabled } from './mockClient'

export function createClient() {
  if (isMockEnabled()) {
    return getMockClient() as any
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
