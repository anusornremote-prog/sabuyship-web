'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function PaymentApprovalModal({ 
  payment, 
  order, 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  payment: any, 
  order: any, 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!payment || !order) return null;

  const handleApprove = async () => {
    try {
      setLoading(true)
      // 1. Update payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'APPROVED' })
        .eq('id', payment.id)
      
      if (paymentError) throw paymentError

      // 2. Determine which round to update to PAID
      const roundToUpdate = order.payment_round_1_status === 'UPLOADED' ? 'payment_round_1_status' :
                            order.payment_round_2_status === 'UPLOADED' ? 'payment_round_2_status' :
                            order.payment_round_3_status === 'UPLOADED' ? 'payment_round_3_status' : null;

      let updates: any = { status: 'PAID' };
      if (roundToUpdate) {
        updates[roundToUpdate] = 'PAID';
        
        // Also update order overall status based on the round
        if (roundToUpdate === 'payment_round_1_status') updates.status = 'PURCHASED'; // Changed from PAID to PURCHASED to signify we bought the items
        else if (roundToUpdate === 'payment_round_2_status') updates.status = 'ARRIVED'; // Not fully accurate, but status logic usually handled elsewhere or manually. Wait, maybe keep status as what it was unless it's round 1.
        // Actually, let's keep it simple: just update the round status. Admin can update overall status manually if needed.
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(roundToUpdate ? { [roundToUpdate]: 'PAID' } : { status: 'PAID' }) // If we can't infer, fallback to status
        .eq('id', order.id)

      if (orderError) throw orderError

      // 3. Add tracking log
      await supabase
        .from('tracking_logs')
        .insert({
          order_id: order.id,
          status: 'PAID',
          notes: 'ยืนยันการชำระเงินเรียบร้อยแล้ว'
        })

      alert('ยืนยันการชำระเงินสำเร็จ')
      onSuccess()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('payments')
        .update({ status: 'REJECTED' })
        .eq('id', payment.id)
      
      if (error) throw error

      const roundToUpdate = order.payment_round_1_status === 'UPLOADED' ? 'payment_round_1_status' :
                            order.payment_round_2_status === 'UPLOADED' ? 'payment_round_2_status' :
                            order.payment_round_3_status === 'UPLOADED' ? 'payment_round_3_status' : null;

      if (roundToUpdate) {
        await supabase
          .from('orders')
          .update({ [roundToUpdate]: 'REJECTED' })
          .eq('id', order.id)
      }

      alert('ปฏิเสธการชำระเงินแล้ว')
      onSuccess()
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent>
        <div className="flex justify-between items-start">
          <DialogHeader>
            <DialogTitle>ตรวจสอบการชำระเงิน</DialogTitle>
            <DialogDescription>รหัสคำสั่งซื้อ: {order.order_number}</DialogDescription>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={() => !loading && onClose()} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
            <p className="flex justify-between items-center">
              <span className="text-slate-600">ยอดเงินที่โอน:</span> 
              <span className="font-bold text-primary text-lg">฿{Number(payment.amount).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
            </p>
            <p className="flex justify-between items-center mt-2">
              <span className="text-slate-600">วัน-เวลาที่โอน:</span> 
              <span className="font-medium text-slate-800">{new Date(payment.payment_date).toLocaleString('th-TH')}</span>
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-slate-700">สลิปหลักฐาน</p>
            <div className="border rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center min-h-[300px] relative">
              {payment.slip_url ? (
                <img src={payment.slip_url} alt="Payment Slip" className="max-w-full max-h-[500px] object-contain" />
              ) : (
                <p className="text-slate-400">ไม่มีรูปสลิป</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleReject} disabled={loading} className="text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 cursor-pointer">
              <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ (ข้อมูลไม่ถูกต้อง)
            </Button>
            <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              ยืนยันการชำระเงิน
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
