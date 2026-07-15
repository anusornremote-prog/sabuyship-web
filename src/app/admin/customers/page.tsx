"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Users, Loader2, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import AdminCreateInquiryModal from "./AdminCreateInquiryModal"

export default function AdminCustomers() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateInquiryModalOpen, setIsCreateInquiryModalOpen] = useState(false)
  const [selectedCustomerForInquiry, setSelectedCustomerForInquiry] = useState<any | null>(null)

  const ITEMS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from("profiles")
        .select(`
          id,
          customer_code,
          full_name,
          phone,
          line_id,
          created_at,
          role
        `, { count: 'exact' })
        .eq('role', 'CUSTOMER')

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,customer_code.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,line_id.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

      if (error) throw error

      setCustomers(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [currentPage])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCustomers()
  }

  const filteredCustomers = customers

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            จัดการข้อมูลลูกค้า
          </h1>
          <p className="text-slate-500 mt-1">รายชื่อและข้อมูลติดต่อของลูกค้าในระบบ</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="ค้นหา รหัสลูกค้า, ชื่อ, เบอร์โทร, LINE ID... (กด Enter)" 
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">รหัสลูกค้า</th>
                    <th className="px-6 py-4 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-4 font-semibold">เบอร์โทรศัพท์</th>
                    <th className="px-6 py-4 font-semibold">LINE ID</th>
                    <th className="px-6 py-4 font-semibold">วันที่สมัคร</th>
                    <th className="px-6 py-4 font-semibold text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {customer.customer_code || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{customer.full_name || "ไม่มีชื่อ"}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {customer.line_id || "-"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(customer.created_at).toLocaleString('th-TH')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200"
                            onClick={() => {
                              setSelectedCustomerForInquiry(customer)
                              setIsCreateInquiryModalOpen(true)
                            }}
                          >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            สร้างคำขอประเมินราคา
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 opacity-20" />
                          <p>ไม่พบข้อมูลลูกค้า</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
          )}

          {/* Pagination Controls */}
          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-slate-500">
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จากทั้งหมด {totalCount} รายการ
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ก่อนหน้า
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminCreateInquiryModal 
        isOpen={isCreateInquiryModalOpen}
        onClose={() => setIsCreateInquiryModalOpen(false)}
        customer={selectedCustomerForInquiry}
      />
    </div>
  )
}
