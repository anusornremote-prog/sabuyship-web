"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Users, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function AdminCustomers() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          customer_code,
          full_name,
          phone,
          line_id,
          created_at,
          role
        `)
        .eq('role', 'CUSTOMER')
        .order("created_at", { ascending: false })

      if (error) throw error

      setCustomers(data || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (customer.full_name?.toLowerCase() || "").includes(searchLower) ||
      (customer.customer_code?.toLowerCase() || "").includes(searchLower) ||
      (customer.phone || "").includes(searchLower) ||
      (customer.line_id?.toLowerCase() || "").includes(searchLower)
    )
  })

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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="ค้นหา รหัสลูกค้า, ชื่อ, เบอร์โทร, LINE ID..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
        </CardContent>
      </Card>
    </div>
  )
}
