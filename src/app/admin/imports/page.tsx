import { FileSpreadsheet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function ShipmentImportsPage() {
  const supabase = await createClient()
  const { data: batches, error } = await supabase
    .from("shipment_import_batches")
    .select("id, file_name, total_rows, imported_rows, failed_rows, created_at, creator:created_by(full_name)")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><FileSpreadsheet className="h-6 w-6 text-primary" />ประวัตินำเข้า Excel</h1>
        <p className="mt-1 text-sm text-slate-500">ตรวจสอบไฟล์ จำนวนแถว และผู้ดำเนินการย้อนหลัง</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">ล่าสุด 100 ครั้ง</CardTitle></CardHeader>
        <CardContent className="p-0">
          {error ? <div className="p-6 text-sm text-rose-600">โหลดประวัติไม่สำเร็จ</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">วันเวลา</th><th className="px-4 py-3">ไฟล์</th><th className="px-4 py-3">ผลลัพธ์</th><th className="px-4 py-3">ผู้ดำเนินการ</th></tr></thead>
                <tbody className="divide-y">
                  {(batches || []).map((batch: any) => <tr key={batch.id}>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(batch.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</td>
                    <td className="px-4 py-3 font-medium">{batch.file_name}</td>
                    <td className="px-4 py-3"><span className="font-bold text-emerald-700">{batch.imported_rows}</span> / {batch.total_rows}{batch.failed_rows > 0 ? <span className="ml-2 text-rose-600">(ผิดพลาด {batch.failed_rows})</span> : null}</td>
                    <td className="px-4 py-3">{batch.creator?.full_name || "-"}</td>
                  </tr>)}
                  {!batches?.length && <tr><td colSpan={4} className="p-10 text-center text-slate-500">ยังไม่มีประวัตินำเข้า</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
