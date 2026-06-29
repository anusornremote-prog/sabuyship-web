"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle2, XCircle, Wallet, Image as ImageIcon } from "lucide-react"

export default function AdminWalletPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPendingTopups = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select(`
          *,
          profiles (
            full_name,
            customer_code,
            wallet_balance
          )
        `)
        .eq("type", "TOPUP")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      if (data) setTransactions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingTopups()
  }, [])

  const handleApprove = async (tx: any) => {
    if (!confirm(`ยืนยันการอนุมัติยอดเงิน ${Number(tx.amount).toLocaleString()} บาท ให้กับลูกค้า ${tx.profiles.customer_code}?`)) return
    
    setProcessingId(tx.id)
    try {
      // 1. Update wallet_balance in profiles
      const newBalance = Number(tx.profiles.wallet_balance || 0) + Number(tx.amount)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", tx.customer_id)

      if (profileError) throw profileError

      // 2. Update transaction status
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .update({ status: "APPROVED", admin_note: "อนุมัติเรียบร้อย" })
        .eq("id", tx.id)

      if (txError) throw txError

      alert("อนุมัติยอดเงินเรียบร้อยแล้ว")
      fetchPendingTopups()
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดในการอนุมัติ")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (txId: string) => {
    const reason = prompt("กรุณาระบุเหตุผลที่ปฏิเสธ (เช่น สลิปซ้ำ, ยอดไม่ตรง):")
    if (reason === null) return // User cancelled

    setProcessingId(txId)
    try {
      const { error } = await supabase
        .from("wallet_transactions")
        .update({ status: "REJECTED", admin_note: reason })
        .eq("id", txId)

      if (error) throw error
      alert("ปฏิเสธรายการเรียบร้อยแล้ว")
      fetchPendingTopups()
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดในการปฏิเสธรายการ")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการกระเป๋าเงิน (Wallet)</h1>
          <p className="text-slate-600">อนุมัติการแจ้งโอนและตรวจสอบประวัติการเงินลูกค้า</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <CardTitle>รายการแจ้งโอนทั้งหมด</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">วันที่ / เวลา</th>
                  <th className="px-6 py-4 font-medium">ลูกค้า</th>
                  <th className="px-6 py-4 font-medium">สลิป</th>
                  <th className="px-6 py-4 font-medium">จำนวนเงิน</th>
                  <th className="px-6 py-4 font-medium">สถานะ</th>
                  <th className="px-6 py-4 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {new Date(tx.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{tx.profiles?.customer_code}</div>
                        <div className="text-xs text-slate-500">{tx.profiles?.full_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.reference_image ? (
                          <a href={tx.reference_image} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <ImageIcon className="w-4 h-4" /> ดูสลิป
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600">+{Number(tx.amount).toLocaleString('th-TH')}</span>
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === 'PENDING' ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">รออนุมัติ</span>
                        ) : tx.status === 'APPROVED' ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">อนุมัติแล้ว</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">ปฏิเสธ</span>
                        )}
                        {tx.admin_note && <div className="text-xs text-slate-500 mt-1">{tx.admin_note}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(tx)}
                              disabled={processingId === tx.id}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> อนุมัติ
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(tx.id)}
                              disabled={processingId === tx.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      ไม่มีรายการแจ้งโอน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
