'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react"

interface WalletDeductModalProps {
  isOpen: boolean
  onClose: () => void
  customer: { id: string; full_name: string; wallet_balance?: number } | null
  referenceId?: string
  defaultAmount?: number
  defaultDescription?: string
  onSuccess: () => void
}

export function WalletDeductModal({ 
  isOpen, 
  onClose, 
  customer, 
  referenceId, 
  defaultAmount,
  defaultDescription,
  onSuccess 
}: WalletDeductModalProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(defaultAmount?.toString() || "")
  const [description, setDescription] = useState(defaultDescription || "")
  const [errorMsg, setErrorMsg] = useState("")

  // Reset states when opened with new defaults
  useEffect(() => {
    if (defaultAmount) setAmount(defaultAmount.toString())
    if (defaultDescription) setDescription(defaultDescription)
  }, [defaultAmount, defaultDescription, isOpen])

  if (!customer) return null

  const handleDeduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินที่ถูกต้อง")
      return
    }

    try {
      setLoading(true)
      setErrorMsg("")

      const res = await fetch('/api/wallet/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: Number(amount),
          description: description,
          referenceId: referenceId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการตัดเงิน')
      }

      alert(`ตัดเงินสำเร็จ! ยอดคงเหลือ: ฿${data.newBalance.toLocaleString()}`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Wallet className="w-5 h-5" />
            ตัดยอดเงินจาก Wallet
          </DialogTitle>
          <DialogDescription>
            หักยอดเงินจากกระเป๋าเงินของลูกค้า
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-rose-100 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleDeduct} className="space-y-4 py-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">ลูกค้า: <span className="font-semibold text-slate-900">{customer.full_name}</span></p>
            {customer.wallet_balance !== undefined && (
              <p className="text-sm text-slate-600 mt-1">
                ยอดเงินคงเหลือ: <span className="font-bold text-primary">฿{Number(customer.wallet_balance).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">จำนวนเงินที่ต้องการหัก (บาท) *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="ระบุจำนวนเงิน..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">คำอธิบายการหักเงิน (Description)</label>
            <Input
              placeholder="เช่น ค่าขนส่งจีน-ไทย รอบวันที่ XX"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="destructive" disabled={loading} className="bg-rose-600 hover:bg-rose-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              ยืนยันการหักเงิน
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
