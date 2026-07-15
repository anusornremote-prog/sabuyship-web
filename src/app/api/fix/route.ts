import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: quotations, error } = await supabase
    .from('quotations')
    .select('inquiry_id, orders(id)')
    .not('inquiry_id', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inquiriesToUpdate = quotations
    .filter((q: any) => q.orders && q.orders.length > 0)
    .map((q: any) => q.inquiry_id)

  if (inquiriesToUpdate.length > 0) {
    const { data, error: updateError } = await supabase
      .from('inquiries')
      .update({ status: 'ORDERED' })
      .in('id', inquiriesToUpdate)
      .select()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data?.length })
  }

  return NextResponse.json({ success: true, updated: 0 })
}
