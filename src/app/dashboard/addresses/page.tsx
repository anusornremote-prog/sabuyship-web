"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, Edit, Trash2, Loader2, Star, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AddressFormModal } from "./AddressFormModal"

export default function AddressesPage() {
  const supabase = createClient()
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบที่อยู่นี้?")) return
    
    try {
      setDeletingId(id)
      const { error } = await supabase.from("addresses").delete().eq("id", id)
      if (error) throw error
      
      setAddresses(addresses.filter(addr => addr.id !== id))
    } catch (error) {
      console.error("Error deleting address:", error)
      alert("ไม่สามารถลบที่อยู่ได้")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (address: any) => {
    if (address.is_default) return
    
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // Set all to false first
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", userData.user.id)

      // Set selected to true
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", address.id)

      fetchAddresses()
    } catch (error) {
      console.error("Error setting default address:", error)
    }
  }

  const openAddModal = () => {
    setEditingAddress(null)
    setModalOpen(true)
  }

  const openEditModal = (address: any) => {
    setEditingAddress(address)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            สมุดที่อยู่
          </h1>
          <p className="text-slate-500 mt-1">จัดการที่อยู่สำหรับจัดส่งสินค้าในประเทศไทย</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          เพิ่มที่อยู่ใหม่
        </Button>
      </div>

      {loading ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>กำลังโหลดข้อมูลที่อยู่...</p>
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">ยังไม่มีที่อยู่จัดส่ง</h3>
            <p className="max-w-sm mb-6">คุณยังไม่ได้เพิ่มที่อยู่สำหรับจัดส่งสินค้า กรุณาเพิ่มที่อยู่อย่างน้อย 1 แห่งเพื่อความสะดวกในการจัดส่ง</p>
            <Button onClick={openAddModal}>
              เพิ่มที่อยู่จัดส่ง
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card 
              key={address.id} 
              className={`border-slate-200 shadow-sm transition-all hover:shadow-md ${address.is_default ? 'border-primary ring-1 ring-primary/20' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{address.full_name}</h3>
                    {address.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        <CheckCircle className="w-3 h-3" />
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => openEditModal(address)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(address.id)} disabled={deletingId === address.id}>
                      {deletingId === address.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-700">เบอร์โทรศัพท์:</span> {address.phone}</p>
                  <p className="leading-relaxed">
                    {address.address_line}
                    <br />
                    {address.subdistrict && `ตำบล/แขวง ${address.subdistrict} `}
                    {address.district && `อำเภอ/เขต ${address.district} `}
                    <br />
                    {address.province && `จังหวัด ${address.province} `}
                    {address.postal_code}
                  </p>
                </div>
                
                {!address.is_default && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleSetDefault(address)}>
                      <Star className="w-3.5 h-3.5 mr-1.5" />
                      ตั้งเป็นที่อยู่เริ่มต้น
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressFormModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          address={editingAddress} 
          onSuccess={fetchAddresses} 
        />
      )}
    </div>
  )
}
