'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, X, AlertTriangle } from "lucide-react"
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
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const supabase = createClient()

  if (!payment || !order) return null;

  const handleClose = () => {
    if (!loading) {
      setShowRejectForm(false)
      setRejectionReason('')
      onClose()
    }
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'APPROVED' })
        .eq('id', payment.id)
      if (paymentError) throw paymentError

      const roundToUpdate = order.payment_round_1_status === 'UPLOADED' ? 'payment_round_1_status' :
                            order.payment_round_2_status === 'UPLOADED' ? 'payment_round_2_status' :
                            order.payment_round_3_status === 'UPLOADED' ? 'payment_round_3_status' : null;

      let updates: any = {};
      if (roundToUpdate) {
        updates[roundToUpdate] = 'PAID';
        if (roundToUpdate === 'payment_round_1_status') updates.status = 'ORDERED';
        else if (roundToUpdate === 'payment_round_2_status') updates.status = 'SHIPPING';
        else if (roundToUpdate === 'payment_round_3_status') updates.status = 'OUT_FOR_DELIVERY';
      } else {
        updates.status = 'PAID';
      }

      const { error: orderError } = await supabase.from('orders').update(updates).eq('id', order.id)
      if (orderError) throw orderError

      // Handle child orders for Round 3 consolidation
      if (roundToUpdate === 'payment_round_3_status') {
        const { data: childOrders } = await supabase
          .from('orders')
          .select('id, order_number, customer_id')
          .eq('consolidated_into_id', order.id)

        if (childOrders && childOrders.length > 0) {
          const childIds = childOrders.map(o => o.id)
          await supabase.from('orders').update({ status: 'OUT_FOR_DELIVERY', payment_round_3_status: 'PAID' }).in('id', childIds)
          await supabase.from('tracking_logs').insert(childIds.map(cid => ({
            order_id: cid,
            status: 'PAID_ROUND_3',
            notes: `ชำระเงินรอบที่ 3 เรียบร้อยแล้ว (รวมบิลกับออเดอร์หลัก ${order.order_number})`
          })))
          for (const co of childOrders) {
            if (co.customer_id) {
              await sendCustomerNotification(co.customer_id, `✅ ยอดชำระเงินรอบที่ 3 ได้รับการอนุมัติแล้ว (รวมบิลกับ ${order.order_number})\nสินค้ากำลังเตรียมนำจ่ายถึงมือคุณค่ะ`)
            }
          }
        }
      }

      let logStatus = 'PAID'
      let logNotes = 'ยืนยันการชำระเงินเรียบร้อยแล้ว'
      if (roundToUpdate === 'payment_round_1_status') { logStatus = 'PAID_ROUND_1'; logNotes = 'ชำระเงินรอบที่ 1 เรียบร้อยแล้ว (ค่าสินค้า)' }
      else if (roundToUpdate === 'payment_round_2_status') { logStatus = 'PAID_ROUND_2'; logNotes = 'ชำระเงินรอบที่ 2 เรียบร้อยแล้ว (ค่าขนส่งจีน-ไทย)' }
      else if (roundToUpdate === 'payment_round_3_status') { logStatus = 'PAID_ROUND_3'; logNotes = 'ชำระเงินรอบที่ 3 เรียบร้อยแล้ว (ค่าจัดส่งในไทย)' }
      await supabase.from('tracking_logs').insert({ order_id: order.id, status: logStatus, notes: logNotes })

      let message = "ยอดชำระเงินของคุณได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้วค่ะ";
      if (roundToUpdate === 'payment_round_1_status') message = `✅ ยอดชำระเงินรอบที่ 1 ได้รับการอนุมัติแล้ว\nระบบกำลังดำเนินการสั่งซื้อสินค้าให้คุณค่ะ`;
      else if (roundToUpdate === 'payment_round_2_status') message = `✅ ยอดชำระเงินรอบที่ 2 ได้รับการอนุมัติแล้ว\nสินค้าจะถูกจัดส่งมายังโกดังไทยในขั้นตอนต่อไปค่ะ`;
      else if (roundToUpdate === 'payment_round_3_status') message = `✅ ยอดชำระเงินรอบที่ 3 ได้รับการอนุมัติแล้ว\nสินค้ากำลังเตรียมนำจ่ายถึงมือคุณค่ะ`;
      
      const targetUserId = order.customer_id || order.user_id;
      if (targetUserId) await sendCustomerNotification(targetUserId, message);

      toast.success('ยืนยันการชำระเงินสำเร็จ')
      handleClose()
      onSuccess()
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ปฏิเสธสลิป')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase
        .from('payments')
        .update({ status: 'REJECTED', rejection_reason: rejectionReason.trim() })
        .eq('id', payment.id)
      if (error) throw error

      const roundToUpdate = order.payment_round_1_status === 'UPLOADED' ? 'payment_round_1_status' :
                            order.payment_round_2_status === 'UPLOADED' ? 'payment_round_2_status' :
                            order.payment_round_3_status === 'UPLOADED' ? 'payment_round_3_status' : null;

      if (roundToUpdate) {
        await supabase.from('orders').update({ [roundToUpdate]: 'REJECTED' }).eq('id', order.id)
        
        let rejectNotes = `ปฏิเสธสลิป: ${rejectionReason.trim()}`
        if (roundToUpdate === 'payment_round_1_status') rejectNotes = `ปฏิเสธสลิปชำระเงินรอบที่ 1: ${rejectionReason.trim()}`
        else if (roundToUpdate === 'payment_round_2_status') rejectNotes = `ปฏิเสธสลิปชำระเงินรอบที่ 2: ${rejectionReason.trim()}`
        else if (roundToUpdate === 'payment_round_3_status') rejectNotes = `ปฏิเสธสลิปชำระเงินรอบที่ 3: ${rejectionReason.trim()}`

        await supabase.from('tracking_logs').insert({ order_id: order.id, status: 'PAYMENT_REJECTED', notes: rejectNotes })

        const targetId = order.customer_id || order.user_id
        if (targetId) {
          const roundName = roundToUpdate === 'payment_round_1_status' ? '1 (ค่าสินค้า)' :
                            roundToUpdate === 'payment_round_2_status' ? '2 (ค่าจัดส่งจีน-ไทย)' : '3 (ค่าจัดส่งในไทย)';
          await sendCustomerNotification(
            targetId,
            `❌ สลิปชำระเงินรอบที่ ${roundName} สำหรับออเดอร์ ${order.order_number} ไม่ผ่านการอนุมัติ\n\n📋 เหตุผล: ${rejectionReason.trim()}\n\nกรุณาตรวจสอบและอัปโหลดหลักฐานใหม่อีกครั้งค่ะ`
          );
        }
      }

      toast.success('ปฏิเสธการชำระเงินแล้ว')
      handleClose()
      onSuccess()
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <div className="flex justify-between items-start">
          <DialogHeader>
            <DialogTitle>ตรวจสอบการชำระเงิน</DialogTitle>
            <DialogDescription>รหัสคำสั่งซื้อ: {order.order_number}</DialogDescription>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full">
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

          {/* Reject Form with reason */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">ระบุเหตุผลที่ปฏิเสธสลิป</p>
              </div>
              <p className="text-xs text-red-600">เหตุผลนี้จะถูกส่งให้ลูกค้าทราบผ่าน LINE และแสดงบนหน้าออเดอร์ของลูกค้าด้วย</p>
              <textarea
                className="w-full text-sm p-3 rounded-lg border border-red-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={3}
                placeholder="เช่น: ยอดเงินในสลิปไม่ตรงกับยอดที่แจ้ง, สลิปไม่ชัดเจน, ชื่อบัญชีผู้รับไม่ถูกต้อง..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectionReason('') }} disabled={loading}>
                  ยกเลิก
                </Button>
                <Button variant="destructive" size="sm" onClick={handleRejectConfirm} disabled={loading || !rejectionReason.trim()}>
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  ยืนยันปฏิเสธสลิป
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              ปิด
            </Button>
            {!showRejectForm && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => setShowRejectForm(true)} disabled={loading}>
                  <XCircle className="w-4 h-4 mr-1" /> ปฏิเสธ
                </Button>
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  ยืนยันการชำระเงิน
                </Button>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
