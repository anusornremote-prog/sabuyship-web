import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // First check if inquiries has customer_id set
  const { data: inq1, error: err1 } = await supabase
    .from("inquiries")
    .select("id, customer_id, customer_name")
    .limit(5)

  // Then check the relation
  const { data: inq2, error: err2 } = await supabase
    .from("inquiries")
    .select("*, profiles!customer_id(customer_code)")
    .limit(5)

  const { data: inq3, error: err3 } = await supabase
    .from("inquiries")
    .select("*, customer:customer_id(customer_code)")
    .limit(5)

  return NextResponse.json({ 
    inq1, err1, 
    inq2, err2,
    inq3, err3
  })
}
