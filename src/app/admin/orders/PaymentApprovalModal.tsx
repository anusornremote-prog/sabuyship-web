'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { sendCustomerNotification } from "@/lib/notify"

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

      let updates: any = {};
      if (roundToUpdate) {
        updates[roundToUpdate] = 'PAID';
        
        // Also update order overall status based on the round
        if (roundToUpdate === 'payment_round_1_status') updates.status = 'ORDERED'; // สั่งซื้อแล้ว รอเข้าโกดังจีน
        else if (roundToUpdate === 'payment_round_2_status') updates.status = 'SHIPPING'; // กำลังจัดส่งมาไทย
        else if (roundToUpdate === 'payment_round_3_status') updates.status = 'OUT_FOR_DELIVERY'; // กำลังนำจ่าย
      } else {
        updates.status = 'PAID';
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id)

      if (orderError) throw orderError

      // 3. Add tracking log
      let logStatus = 'PAID'
      let logNotes = 'ยืนยันการชำระเงินเรียบร้อยแล้ว'
      if (roundToUpdate === 'payment_round_1_status') {
        logStatus = 'PAID_ROUND_1'
        logNotes = 'ชำระเงินรอบที่ 1 เรียบร้อยแล้ว (ค่าสินค้า)'
      } else if (roundToUpdate === 'payment_round_2_status') {
        logStatus = 'PAID_ROUND_2'
        logNotes = 'ชำระเงินรอบที่ 2 เรียบร้อยแล้ว (ค่าขนส่งจีน-ไทย)'
      } else if (roundToUpdate === 'payment_round_3_status') {
        logStatus = 'PAID_ROUND_3'
        logNotes = 'ชำระเงินรอบที่ 3 เรียบร้อยแล้ว (ค่าจัดส่งในไทย)'
      }

      await supabase
        .from('tracking_logs')
        .insert({
          order_id: order.id,
          status: logStatus,
          notes: logNotes
        })

      // Send LINE notification
      let message = "ยอดชำระเงินของคุณได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้วค่ะ";
      if (roundToUpdate === 'payment_round_1_status') {
        message = `✅ ยอดชำระเงินรอบที่ 1 ได้รับการอนุมัติแล้ว\nระบบกำลังดำเนินการสั่งซื้อสินค้าให้คุณค่ะ`;
      } else if (roundToUpdate === 'payment_round_2_status') {
        message = `✅ ยอดชำระเงินรอบที่ 2 ได้รับการอนุมัติแล้ว\nสินค้าจะถูกจัดส่งมายังโกดังไทยในขั้นตอนต่อไปค่ะ`;
      } else if (roundToUpdate === 'payment_round_3_status') {
        message = `✅ ยอดชำระเงินรอบที่ 3 ได้รับการอนุมัติแล้ว\nสินค้ากำลังเตรียมนำจ่ายถึงมือคุณค่ะ`;
      }
      
      if (order.user_id) {
        await sendCustomerNotification(order.user_id, message);
      }

      toast.success('ยืนยันการชำระเงินสำเร็จ')
      onSuccess()
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message)
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
          
        let rejectNotes = 'สลิปถูกปฏิเสธ'
        if (roundToUpdate === 'payment_round_1_status') rejectNotes = 'ปฏิเสธสลิปชำระเงินรอบที่ 1 (กรุณาแนบใหม่)'
        if (roundToUpdate === 'payment_round_2_status') rejectNotes = 'ปฏิเสธสลิปชำระเงินรอบที่ 2 (กรุณาแนบใหม่)'
        if (roundToUpdate === 'payment_round_3_status') rejectNotes = 'ปฏิเสธสลิปชำระเงินรอบที่ 3 (กรุณาแนบใหม่)'

        await supabase
          .from('tracking_logs')
          .insert({
            order_id: order.id,
            status: 'PAYMENT_REJECTED',
            notes: rejectNotes
          })
      }

      toast.success('ปฏิเสธการชำระเงินแล้ว')
      onSuccess()
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message)
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
            <Button variant="outline" onClick={onClose} disabled={loading}>
              ปิด
            </Button>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={loading}>
                <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ (ข้อมูลไม่ถูกต้อง)
              </Button>
              <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                ยืนยันการชำระเงิน
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
