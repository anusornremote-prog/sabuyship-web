'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, X, AlertTriangle, ZoomIn, ExternalLink } from "lucide-react"
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
  const [isImageExpanded, setIsImageExpanded] = useState(false)
  const supabase = createClient()

  if (!payment || !order) return null;

  const handleClose = () => {
    if (!loading) {
      setShowRejectForm(false)
      setRejectionReason('')
      setIsImageExpanded(false)
      onClose()
    }
  }

  const rejectTemplates = [
    "ยอดเงินในสลิปไม่ตรงกับยอดที่แจ้ง",
    "รูปสลิปไม่ชัดเจน ไม่สามารถตรวจสอบได้",
    "สลิปซ้ำ / เคยแจ้งชำระเงินแล้ว",
    "ชื่อบัญชีผู้รับเงินไม่ถูกต้อง",
    "วัน-เวลาในสลิปไม่ตรงกับรายการโอน",
  ]

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

      toast.success('อนุมัติการชำระเงินเรียบร้อยแล้ว')
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
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', payment.id)

      if (paymentError) throw paymentError

      const roundToUpdate = order.payment_round_1_status === 'UPLOADED' ? 'payment_round_1_status' :
                            order.payment_round_2_status === 'UPLOADED' ? 'payment_round_2_status' :
                            order.payment_round_3_status === 'UPLOADED' ? 'payment_round_3_status' : null;

      if (roundToUpdate) {
        await supabase
          .from('orders')
          .update({
            [roundToUpdate]: 'REJECTED',
            status: 'PAYMENT_REJECTED'
          })
          .eq('id', order.id)

        await supabase.from('tracking_logs').insert({
          order_id: order.id,
          status: 'PAYMENT_REJECTED',
          notes: `สลิปชำระเงินถูกปฏิเสธ: ${rejectionReason.trim()}`
        })
      }

      const targetUserId = order.customer_id || order.user_id;
      if (targetUserId) {
        const roundName = roundToUpdate === 'payment_round_1_status' ? 'รอบที่ 1' :
                          roundToUpdate === 'payment_round_2_status' ? 'รอบที่ 2' :
                          roundToUpdate === 'payment_round_3_status' ? 'รอบที่ 3' : '';
        await sendCustomerNotification(
          targetUserId,
          `⚠️ สลิปชำระเงิน ${roundName} สำหรับออเดอร์ ${order.order_number} ไม่ผ่านการตรวจสอบ\n\n📌 เหตุผล: ${rejectionReason.trim()}\n\n👉 กรุณาเข้าสู่ระบบเพื่อแนบสลิปใหม่อีกครั้งค่ะ`
        )
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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg p-5 sm:p-6 bg-white rounded-3xl shadow-2xl">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>💳</span> ตรวจสอบการชำระเงิน
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">
                รหัสคำสั่งซื้อ: <span className="font-bold text-primary">{order.order_number}</span>
              </DialogDescription>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full cursor-pointer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            {/* Amount & Date Card */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">ยอดเงินที่ลูกค้าแจ้ง:</span> 
                <span className="font-black text-primary text-base sm:text-lg">
                  ฿ {Number(payment.amount).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">วัน-เวลาที่โอน:</span> 
                <span className="font-bold text-slate-800 font-mono">
                  {new Date(payment.payment_date).toLocaleString('th-TH')}
                </span>
              </div>
            </div>

            {/* Slip Image Preview with Zoom Feature */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  สลิปหลักฐาน (แตะที่รูปเพื่อขยาย)
                </p>
                {payment.slip_url && (
                  <a href={payment.slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> เปิดรูปเต็ม
                  </a>
                )}
              </div>

              <div 
                onClick={() => payment.slip_url && setIsImageExpanded(true)}
                className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-100/70 flex items-center justify-center min-h-[220px] max-h-[360px] relative cursor-pointer group"
              >
                {payment.slip_url ? (
                  <>
                    <img src={payment.slip_url} alt="Payment Slip" className="max-w-full max-h-[350px] object-contain rounded-xl" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                      <ZoomIn className="w-5 h-5" /> แตะเพื่อขยายเต็มจอ
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 text-xs">ไม่มีรูปสลิป</p>
                )}
              </div>
            </div>

            {/* Rejection Form with Quick Reason Chips */}
            {showRejectForm && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <p className="text-xs font-black">ระบุเหตุผลที่ปฏิเสธสลิป (ส่งแจ้งเตือนเข้า LINE ลูกค้า)</p>
                </div>

                {/* Quick Reason Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {rejectTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(template)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-left ${
                        rejectionReason === template 
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                          : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {template}
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-rose-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={2}
                  placeholder="พิมพ์เหตุผลเพิ่มเติม..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={loading}
                />

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setShowRejectForm(false); setRejectionReason('') }} disabled={loading} className="h-9 cursor-pointer text-xs">
                    ยกเลิก
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRejectConfirm} disabled={loading || !rejectionReason.trim()} className="h-9 font-bold cursor-pointer text-xs">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                    ยืนยันปฏิเสธสลิป
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons Footer */}
            <DialogFooter className="pt-2 gap-2 sm:justify-between flex-col-reverse sm:flex-row">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={loading} className="cursor-pointer text-xs h-11">
                ปิด
              </Button>
              {!showRejectForm && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowRejectForm(true)} 
                    disabled={loading}
                    className="flex-1 sm:flex-none h-11 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 mr-1 text-rose-600" /> ปฏิเสธสลิป
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleApprove} 
                    disabled={loading}
                    className="flex-1 sm:flex-none h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl cursor-pointer shadow-md shadow-emerald-600/25"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                    อนุมัติการชำระเงิน
                  </Button>
                </div>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Slip Lightbox Modal */}
      {isImageExpanded && payment.slip_url && (
        <div 
          onClick={() => setIsImageExpanded(false)}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-white text-xs bg-black/50 px-3 py-1.5 rounded-full font-mono">
              แตะที่ใดก็ได้เพื่อปิด
            </span>
            <button className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          <img 
            src={payment.slip_url} 
            alt="Payment Slip Full View" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
          />
        </div>
      )}
    </>
  )
}
