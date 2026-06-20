import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, AlertCircle, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface AddressSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (addressId: string) => void
}

export function AddressSelectionModal({ isOpen, onClose, onConfirm }: AddressSelectionModalProps) {
  const supabase = createClient()
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    if (!isOpen) return

    const fetchAddresses = async () => {
      try {
        setLoading(true)
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("customer_id", userData.user.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) throw error

        setAddresses(data || [])
        
        // Auto select default address
        if (data && data.length > 0) {
          const defaultAddr = data.find(a => a.is_default) || data[0]
          setSelectedId(defaultAddr.id)
        }
      } catch (error) {
        console.error("Error fetching addresses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            เลือกที่อยู่สำหรับจัดส่ง
          </DialogTitle>
          <DialogDescription>
            กรุณาเลือกที่อยู่สำหรับจัดส่งสินค้าในประเทศไทย สำหรับออเดอร์นี้
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>กำลังโหลดที่อยู่...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-amber-800 mb-2">คุณยังไม่มีที่อยู่จัดส่ง</h3>
              <p className="text-sm text-amber-700 mb-4">
                กรุณาเพิ่มที่อยู่สำหรับจัดส่งสินค้าอย่างน้อย 1 แห่ง เพื่อทำการอนุมัติคำสั่งซื้อ
              </p>
              <Button asChild>
                <Link href="/dashboard/addresses">
                  <Plus className="w-4 h-4 mr-2" />
                  ไปที่หน้าสมุดที่อยู่
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {addresses.map((address) => (
                <div 
                  key={address.id}
                  onClick={() => setSelectedId(address.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedId === address.id 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{address.full_name}</h4>
                    {address.is_default && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{address.phone}</p>
                  <p className="text-sm text-slate-500">
                    {address.address_line} ต.{address.subdistrict} อ.{address.district} จ.{address.province} {address.postalCode}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t mt-2">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button 
            onClick={() => onConfirm(selectedId)} 
            disabled={!selectedId || addresses.length === 0}
          >
            ยืนยันการสั่งซื้อ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
