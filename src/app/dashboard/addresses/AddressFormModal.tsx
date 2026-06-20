import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  address?: any
  onSuccess: () => void
}

export function AddressFormModal({ isOpen, onClose, address, onSuccess }: AddressFormModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Form states
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [subdistrict, setSubdistrict] = useState("")
  const [district, setDistrict] = useState("")
  const [province, setProvince] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (address) {
      setFullName(address.full_name || "")
      setPhone(address.phone || "")
      setAddressLine(address.address_line || "")
      setSubdistrict(address.subdistrict || "")
      setDistrict(address.district || "")
      setProvince(address.province || "")
      setPostalCode(address.postal_code || "")
      setIsDefault(address.is_default || false)
    } else {
      setFullName("")
      setPhone("")
      setAddressLine("")
      setSubdistrict("")
      setDistrict("")
      setProvince("")
      setPostalCode("")
      setIsDefault(false)
    }
    setErrorMsg("")
  }, [address, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !phone || !addressLine || !province || !postalCode) {
      setErrorMsg("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
      return
    }

    try {
      setLoading(true)
      setErrorMsg("")
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Please login first")

      // If this is set to default, we need to unset other defaults first
      if (isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", userData.user.id)
      }

      const payload = {
        customer_id: userData.user.id,
        full_name: fullName,
        phone: phone,
        address_line: addressLine,
        subdistrict: subdistrict,
        district: district,
        province: province,
        postal_code: postalCode,
        is_default: isDefault
      }

      if (address?.id) {
        // Update existing
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", address.id)
          
        if (error) throw error
      } else {
        // Check if this is the first address, make it default automatically
        if (!isDefault) {
          const { count } = await supabase
            .from("addresses")
            .select("*", { count: 'exact', head: true })
            .eq("customer_id", userData.user.id)
            
          if (count === 0) {
            payload.is_default = true
          }
        }
        
        // Insert new
        const { error } = await supabase
          .from("addresses")
          .insert(payload)
          
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving address:", error)
      setErrorMsg(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{address ? "แก้ไขที่อยู่จัดส่ง" : "เพิ่มที่อยู่จัดส่งใหม่"}</DialogTitle>
          <DialogDescription>
            กรุณากรอกข้อมูลที่อยู่สำหรับจัดส่งสินค้าในประเทศไทยให้ครบถ้วน
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-rose-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">ชื่อ-นามสกุลผู้รับ *</label>
              <Input
                required
                placeholder="ชื่อ-นามสกุล"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์ *</label>
              <Input
                required
                placeholder="เช่น 0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">รายละเอียดที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน) *</label>
            <Textarea
              required
              placeholder="123/45 ซอยสุขุมวิท 1 ถ.สุขุมวิท"
              rows={2}
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">ตำบล / แขวง</label>
              <Input
                placeholder="ตำบล/แขวง"
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">อำเภอ / เขต</label>
              <Input
                placeholder="อำเภอ/เขต"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">จังหวัด *</label>
              <Input
                required
                placeholder="จังหวัด"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">รหัสไปรษณีย์ *</label>
              <Input
                required
                placeholder="รหัสไปรษณีย์"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-slate-700 cursor-pointer">
              ตั้งเป็นที่อยู่จัดส่งเริ่มต้น
            </label>
          </div>

          <DialogFooter className="pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              บันทึกที่อยู่
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
