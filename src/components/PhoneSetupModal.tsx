"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PhoneSetupModal({ isOpen, onSuccess }: { isOpen: boolean, onSuccess: () => void }) {
  const [phone, setPhone] = useState("")
  const [lineId, setLineId] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return alert("กรุณากรอกเบอร์โทรศัพท์")
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { error } = await supabase
      .from('profiles')
      .update({ phone, line_id: lineId })
      .eq('id', user.id)

    setLoading(false)
    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">ข้อมูลติดต่อเพิ่มเติม</h2>
          <p className="text-slate-500 mt-2">
            เพื่อให้การจัดส่งสินค้าเป็นไปอย่างราบรื่น กรุณากรอกเบอร์โทรศัพท์สำหรับการติดต่อครับ
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">เบอร์โทรศัพท์ (จำเป็น) *</label>
            <Input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="08X-XXX-XXXX" 
              required
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">LINE ID (แนะนำเพื่อความสะดวกรวดเร็ว)</label>
            <Input 
              type="text" 
              value={lineId} 
              onChange={(e) => setLineId(e.target.value)} 
              placeholder="LINE ID ของคุณ" 
              className="h-12"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg mt-4 cursor-pointer" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </form>
      </div>
    </div>
  )
}
