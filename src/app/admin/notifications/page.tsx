import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { AdminNotificationHeader } from "./AdminNotificationHeader"

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const isConfigured = Boolean(
    process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_ADMIN_USER_ID
  )

  const { data: logs, error } = await supabase
    .from("notification_logs")
    .select("id, recipient_type, channel, status, error_code, created_at, recipient:recipient_profile_id(full_name, customer_code)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <AdminNotificationHeader isConfigured={isConfigured} />

      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-sm">ประวัติการแจ้งเตือนล่าสุด (Notification Logs)</h2>
          <p className="text-xs text-slate-500 mt-0.5">บันทึกสถานะการส่งข้อความแจ้งเตือนทั้งหมด</p>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <div className="p-6 text-rose-700 text-sm">โหลดประวัติการแจ้งเตือนไม่สำเร็จ</div>
          ) : (logs || []).length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              ยังไม่มีประวัติการส่งแจ้งเตือนในระบบ สามารถกดปุ่ม &quot;ทดสอบส่งแจ้งเตือน LINE&quot; ด้านบนเพื่อทดสอบได้ทันที
            </div>
          ) : (
            <table className="w-full min-w-[650px] text-sm">
              <thead className="bg-slate-50/50 text-left text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3.5">วัน-เวลา</th>
                  <th className="p-3.5">ผู้รับ</th>
                  <th className="p-3.5">ช่องทาง</th>
                  <th className="p-3.5">สถานะ</th>
                  <th className="p-3.5">รหัสข้อผิดพลาด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(logs || []).map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-xs text-slate-600 whitespace-nowrap font-mono">
                      {new Date(log.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">
                      {log.recipient_type === "ADMIN" ? "แอดมิน" : log.recipient?.full_name || log.recipient?.customer_code || "ลูกค้า"}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        log.status === "SENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : log.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {log.status === "SENT" ? "✓ สำเร็จ (SENT)" : log.status === "FAILED" ? "✕ ล้มเหลว (FAILED)" : "ข้าม (SKIPPED)"}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs font-mono text-slate-500">
                      {log.error_code || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
