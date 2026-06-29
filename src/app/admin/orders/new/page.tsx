"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, PackagePlus, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

export default function AdminNewOrder() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  
  // Order details
  const [orderItems, setOrderItems] = useState([
    { product_url: "", product_name: "", product_options: "", quantity: 1, unit_price: 0 }
  ])
  const [shippingRate, setShippingRate] = useState(0) // Admin fee or shipping config
  const [status, setStatus] = useState("NEW")
  
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, customer_code, phone').order('full_name')
      if (data) setCustomers(data)
    }
    fetchCustomers()
  }, [])

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_url: "", product_name: "", product_options: "", quantity: 1, unit_price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      const newItems = [...orderItems]
      newItems.splice(index, 1)
      setOrderItems(newItems)
    }
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setOrderItems(newItems)
  }

  const calculateTotal = () => {
    const itemsTotal = orderItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)
    return itemsTotal + Number(shippingRate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomerId) {
      alert("กรุณาเลือกลูกค้า")
      return
    }

    try {
      setLoading(true)
      
      const { data: userData } = await supabase.auth.getUser()
      const orderNumber = `ORD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`

      // 1. Create Inquiry (as base)
      const { data: inquiry, error: inquiryError } = await supabase
        .from('inquiries')
        .insert({
          customer_id: selectedCustomerId,
          status: 'QUOTED', // Automatically quoted
          product_url: orderItems[0].product_url || 'Manual Order',
          product_name: orderItems[0].product_name || 'Manual Order',
          quantity: orderItems.reduce((sum, item) => sum + Number(item.quantity), 0),
          notes: 'สร้างโดยแอดมิน (Manual)'
        })
        .select()
        .single()

      if (inquiryError) throw inquiryError

      // 2. Create Quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          inquiry_id: inquiry.id,
          total_price: calculateTotal(),
          admin_notes: 'สร้างโดยแอดมิน (Manual)',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()
        
      if (quotationError) throw quotationError

      // 3. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: selectedCustomerId,
          quotation_id: quotation.id,
          order_number: orderNumber,
          status: status
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 4. Create Tracking Log
      await supabase
        .from('tracking_logs')
        .insert({
          order_id: order.id,
          status: status,
          notes: `สร้างใบสั่งซื้อ (Manual) สถานะ: ${status}`
        })

      alert(`สร้างออเดอร์ ${orderNumber} สำเร็จ!`)
      router.push('/admin/orders')

    } catch (err: any) {
      console.error(err)
      alert("เกิดข้อผิดพลาด: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-primary" />
            สร้างคำสั่งซื้อให้ลูกค้า (Manual)
          </h1>
          <p className="text-slate-500 mt-1">คีย์ข้อมูลออเดอร์สำหรับลูกค้าที่สั่งซื้อผ่านช่องทางอื่น</p>
        </div>
      </div>

      <Card className="shadow-sm border-blue-100">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-8">
            
            {/* Section 1: Customer */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">1. ข้อมูลลูกค้า</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">เลือกลูกค้า *</label>
                  <select 
                    required
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="" disabled>-- ค้นหาและเลือกลูกค้า --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.customer_code} - {c.full_name} ({c.phone || 'ไม่มีเบอร์โทร'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">สถานะเริ่มต้นของออเดอร์ *</label>
                  <select 
                    required
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="NEW">NEW (รอดำเนินการ/รอจ่ายเงิน)</option>
                    <option value="PAID">PAID (ชำระเงินแล้ว - โอนตรง)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b pb-2">
                <h2 className="text-lg font-bold text-slate-800">2. รายการสินค้า</h2>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="gap-1">
                  <Plus className="w-4 h-4" /> เพิ่มรายการ
                </Button>
              </div>
              
              {orderItems.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-4 relative group">
                  {orderItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4 pr-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">ชื่อสินค้า / คำอธิบาย</label>
                      <Input 
                        required 
                        placeholder="ชื่อสินค้าที่ต้องการสั่ง" 
                        value={item.product_name}
                        onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">ลิงก์สินค้า (URL)</label>
                      <Input 
                        placeholder="https://taobao.com/..." 
                        value={item.product_url}
                        onChange={(e) => handleItemChange(index, 'product_url', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pr-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">ตัวเลือก (สี/ไซส์)</label>
                      <Input 
                        placeholder="เช่น สีแดง ไซส์ L" 
                        value={item.product_options}
                        onChange={(e) => handleItemChange(index, 'product_options', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">จำนวน</label>
                      <Input 
                        type="number" min="1" required 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">ราคาต่อชิ้น (บาท)</label>
                      <Input 
                        type="number" min="0" step="0.01" required 
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 3: Summary */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">3. สรุปยอดเงิน</h2>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ค่าจัดส่งจีน / ค่าบริการอื่นๆ (บาท)</label>
                  <Input 
                    type="number" min="0" step="0.01" 
                    value={shippingRate}
                    onChange={(e) => setShippingRate(Number(e.target.value))}
                  />
                </div>
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมราคาสินค้า ({orderItems.reduce((acc, i) => acc + Number(i.quantity), 0)} ชิ้น):</span>
                    <span>฿{(calculateTotal() - Number(shippingRate)).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าจัดส่ง / ค่าบริการ:</span>
                    <span>฿{Number(shippingRate).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-lg text-slate-900">
                    <span>ยอดสุทธิที่ต้องชำระ:</span>
                    <span className="text-primary">฿{calculateTotal().toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-4">
              <Link href="/admin/orders">
                <Button type="button" variant="outline" className="w-32">ยกเลิก</Button>
              </Link>
              <Button type="submit" variant="orange" disabled={loading} className="w-48 text-base font-bold">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึกสร้างออเดอร์
              </Button>
            </div>
            
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
