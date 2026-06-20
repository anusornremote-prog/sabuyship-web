import { NextResponse } from 'next/server'
import { syncServerStore } from '@/lib/supabase/mockClient'

export async function POST(request: Request) {
  try {
    const { table, data } = await request.json()
    syncServerStore(table, data)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
