import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminAuditPage() {
  const supabase = await createClient()
  const { data: logs, error } = await supabase
    .from("admin_audit_logs")
    .select("id, action, entity_type, entity_id, reason, created_at, actor:actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(200)
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-slate-900">ประวัติการทำงานแอดมิน</h1><p className="text-sm text-slate-600">การเปลี่ยนแปลงสำคัญด้านเงิน ออเดอร์ และการตั้งค่า</p></div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {error ? <div className="p-6 text-rose-700">โหลด Audit Log ไม่สำเร็จ</div> : (
          <table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">เวลา</th><th className="p-3">ผู้ดำเนินการ</th><th className="p-3">การกระทำ</th><th className="p-3">รายการ</th><th className="p-3">เหตุผล</th></tr></thead><tbody className="divide-y">{(logs || []).map((log: any) => <tr key={log.id}><td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString("th-TH")}</td><td className="p-3">{log.actor?.full_name || "ระบบ"}</td><td className="p-3 font-bold">{log.action}</td><td className="p-3 font-mono text-xs">{log.entity_type} {log.entity_id || ""}</td><td className="p-3">{log.reason || "-"}</td></tr>)}</tbody></table>
        )}
      </CardContent></Card>
    </div>
  )
}
