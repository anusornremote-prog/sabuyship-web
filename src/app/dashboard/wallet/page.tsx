"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, Upload, Plus, History, Clock, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTopupOpen, setIsTopupOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single()
      
      if (profile) setBalance(profile.wallet_balance || 0)

      // Fetch transactions
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
      
      if (txs) setTransactions(txs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("กรุณากรอกจำนวนเงินให้ถูกต้อง")
      return
    }
    if (!file) {
      setError("กรุณาแนบสลิปโอนเงิน")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")

      // Upload slip
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_slips")
        .upload(`wallet/${fileName}`, file)

      if (uploadError) {
        // If bucket doesn't exist or policy blocks
        throw new Error("ไม่สามารถอัปโหลดสลิปได้ กรุณาตรวจสอบว่ามี Bucket 'payment_slips' หรือยัง")
      }

      const { data: publicUrlData } = supabase.storage
        .from("payment_slips")
        .getPublicUrl(`wallet/${fileName}`)

      // Insert transaction
      const { error: insertError } = await supabase
        .from("wallet_transactions")
        .insert({
          customer_id: user.id,
          amount: Number(amount),
          type: "TOPUP",
          status: "PENDING",
          reference_image: publicUrlData.publicUrl,
          description: "เติมเงินเข้าสู่ระบบ"
        })

      if (insertError) throw insertError

      setIsTopupOpen(false)
      setAmount("")
      setFile(null)
      fetchWalletData() // Refresh
      alert("แจ้งเติมเงินเรียบร้อยแล้ว รอแอดมินตรวจสอบครับ")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "เกิดข้อผิดพลาดในการแจ้งเติมเงิน")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-amber-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'สำเร็จ'
      case 'REJECTED': return 'ปฏิเสธ'
      default: return 'รอตรวจสอบ'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">กระเป๋าเงิน (E-Wallet)</h1>
          <p className="text-slate-600">จัดการยอดเงินและประวัติการทำรายการ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-primary to-orange-500 text-white shadow-lg border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-white/80 font-medium mb-2">ยอดเงินคงเหลือ (บาท)</p>
            <h2 className="text-5xl font-bold mb-6">
              {loading ? "..." : balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </h2>
            
            <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full font-bold text-primary hover:bg-white/90">
                  <Plus className="w-5 h-5 mr-2" /> เติมเงินเข้ากระเป๋า
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">แจ้งเติมเงิน</DialogTitle>
                  <DialogDescription>
                    โอนเงินเข้าบัญชีด้านล่าง แล้วแนบสลิปเพื่อยืนยันการเติมเงิน
                  </DialogDescription>
                </DialogHeader>
                
                <div className="bg-slate-50 p-4 rounded-lg border my-4">
                  <p className="text-sm text-slate-500 font-medium mb-1">บัญชีรับโอนเงิน</p>
                  <p className="font-bold text-slate-800 text-lg">ธนาคารกสิกรไทย (KBank)</p>
                  <p className="font-mono text-xl text-primary my-1 tracking-wider">012-3-45678-9</p>
                  <p className="text-sm font-medium text-slate-700">ชื่อบัญชี: บจก. สบาย ชิปปิ้ง</p>
                </div>

                <form onSubmit={handleTopup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium leading-none">จำนวนเงินที่โอน (บาท)</label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="เช่น 1000" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="slip" className="text-sm font-medium leading-none">หลักฐานการโอนเงิน (สลิป)</label>
                    <Input 
                      id="slip" 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "กำลังส่งข้อมูล..." : "ยืนยันการแจ้งโอน"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <CardTitle>ประวัติการทำรายการล่าสุด</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
            ) : transactions.length > 0 ? (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        tx.type === 'TOPUP' ? 'bg-green-100 text-green-600' : 
                        tx.type === 'DEDUCTION' ? 'bg-red-100 text-red-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {tx.type === 'TOPUP' ? 'เติมเงิน' : tx.type === 'DEDUCTION' ? 'ชำระค่าบริการ' : 'คืนเงิน'}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString('th-TH')}</p>
                        {tx.description && <p className="text-xs text-slate-600 mt-0.5">{tx.description}</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`font-bold text-lg ${tx.type === 'DEDUCTION' ? 'text-red-500' : 'text-green-600'}`}>
                        {tx.type === 'DEDUCTION' ? '-' : '+'}{Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {getStatusIcon(tx.status)}
                        {getStatusText(tx.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>ยังไม่มีประวัติการทำรายการ</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
