import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const body = await request.json()
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0 || rows.length > 1000) {
      return NextResponse.json({ error: "ไฟล์ต้องมีข้อมูล 1-1000 แถว" }, { status: 400 })
    }
    const seenTracking = new Set<string>()
    const numericFields = ["quantity", "weight", "shipping_cost_amount", "width", "length", "height"]
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      const customerCode = typeof row?.customer_code === "string" ? row.customer_code.trim() : ""
      const trackingNumber = typeof row?.tracking_number === "string" ? row.tracking_number.trim() : ""
      if (!customerCode || !trackingNumber) {
        return NextResponse.json({ error: `แถวที่ ${index + 2} ไม่มีรหัสลูกค้าหรือเลขแทรค` }, { status: 400 })
      }
      if (seenTracking.has(trackingNumber)) {
        return NextResponse.json({ error: `แถวที่ ${index + 2} มีเลขแทรคซ้ำในไฟล์: ${trackingNumber}` }, { status: 400 })
      }
      seenTracking.add(trackingNumber)
      for (const field of numericFields) {
        const raw = row[field]
        if (raw !== "" && raw !== null && raw !== undefined) {
          const value = Number(raw)
          if (!Number.isFinite(value) || value < 0 || (field === "quantity" && !Number.isInteger(value))) {
            return NextResponse.json({ error: `แถวที่ ${index + 2} ค่า ${field} ไม่ถูกต้อง` }, { status: 400 })
          }
        }
      }
    }
    const customerCodes = [...new Set(rows.map((row: any) => row.customer_code.trim()))]
    const { data: customers, error: customerError } = await auth.supabase
      .from("profiles")
      .select("customer_code")
      .eq("role", "CUSTOMER")
      .in("customer_code", customerCodes)
    if (customerError) throw customerError
    const foundCodes = new Set((customers || []).map((customer) => customer.customer_code))
    const missingCode = customerCodes.find((code) => !foundCodes.has(code))
    if (missingCode) {
      return NextResponse.json({ error: `ไม่พบรหัสลูกค้า ${missingCode} ในระบบ` }, { status: 400 })
    }
    const { data, error } = await auth.supabase.rpc("admin_import_shipments", {
      p_file_name: typeof body.file_name === "string" ? body.file_name : "shipments.xlsx",
      p_rows: rows,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถนำเข้าพัสดุได้" }, { status: 500 })
  }
}
