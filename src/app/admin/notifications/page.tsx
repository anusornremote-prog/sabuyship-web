import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data: logs, error } = await supabase
    .from("notification_logs")
    .select("id, recipient_type, channel, status, error_code, created_at, recipient:recipient_profile_id(full_name, customer_code)")
    .order("created_at", { ascending: false })
    .limit(200)
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-slate-900">ประวัติการแจ้งเตือน</h1><p className="text-sm text-slate-600">ตรวจสอบการส่ง LINE และสาเหตุที่ระบบข้ามหรือส่งไม่สำเร็จ</p></div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {error ? <div className="p-6 text-rose-700">โหลดประวัติการแจ้งเตือนไม่สำเร็จ</div> : (
          <table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">เวลา</th><th className="p-3">ผู้รับ</th><th className="p-3">ช่องทาง</th><th className="p-3">สถานะ</th><th className="p-3">รายละเอียด</th></tr></thead><tbody className="divide-y">{(logs || []).map((log: any) => <tr key={log.id}><td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString("th-TH")}</td><td className="p-3">{log.recipient_type === "ADMIN" ? "แอดมิน" : log.recipient?.full_name || log.recipient?.customer_code || "ลูกค้า"}</td><td className="p-3">{log.channel}</td><td className={`p-3 font-bold ${log.status === "SENT" ? "text-emerald-700" : log.status === "FAILED" ? "text-rose-700" : "text-amber-700"}`}>{log.status}</td><td className="p-3 text-slate-500">{log.error_code || "-"}</td></tr>)}</tbody></table>
        )}
      </CardContent></Card>
    </div>
  )
}
