"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Users, Loader2, PlusCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatBangkokDateTime, formatBangkokShortDate } from "@/lib/date-format"
import AdminCreateInquiryModal from "./AdminCreateInquiryModal"

interface AdminCustomerRow {
  id: string
  customer_code: string | null
  full_name: string | null
  phone: string | null
  line_id: string | null
  line_uid: string | null
  role: string
  created_at: string
  email: string | null
  auth_provider: string
  orders_count: number
  inquiries_count: number
  shipments_count: number
}

function getProviderBadge(provider: string) {
  if (provider === "google") {
    return { label: "Google", className: "bg-blue-50 text-blue-700 border-blue-200" }
  }
  if (provider === "custom:line" || provider === "line") {
    return { label: "LINE", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  }
  return { label: "Email", className: "bg-slate-100 text-slate-700 border-slate-200" }
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"customers" | "orphans">("customers")
  const [orphanCount, setOrphanCount] = useState(0)

  const [isCreateInquiryModalOpen, setIsCreateInquiryModalOpen] = useState(false)
  const [selectedCustomerForInquiry, setSelectedCustomerForInquiry] = useState<AdminCustomerRow | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [loadError, setLoadError] = useState("")

  const ITEMS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchCustomers = useCallback(async (page = currentPage, search = submittedSearch, tab = activeTab) => {
    try {
      setLoading(true)
      setLoadError("")

      const params = new URLSearchParams({
        tab,
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "โหลดข้อมูลลูกค้าไม่สำเร็จ")

      setCustomers(data.customers || [])
      setTotalCount(data.totalCount || 0)
      if (typeof data.orphanCount === "number") {
        setOrphanCount(data.orphanCount)
      }
    } catch (error: unknown) {
      console.error("Error fetching customers:", error)
      setLoadError(error instanceof Error ? error.message : "โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, submittedSearch])

  useEffect(() => {
    fetchCustomers(currentPage, submittedSearch, activeTab)
  }, [activeTab, currentPage, submittedSearch, fetchCustomers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setSubmittedSearch(searchQuery.trim())
  }

  const handleTabChange = (nextTab: "customers" | "orphans") => {
    setActiveTab(nextTab)
    setCurrentPage(1)
  }

  const handleConfirmDelete = async (values: Record<string, string>) => {
    if (!customerToDelete) return
    const target = customerToDelete
    const expectedCode = target.customer_code?.trim() || "DELETE"
    if ((values.confirm_text || "").trim().toUpperCase() !== expectedCode.toUpperCase()) {
      toast.error(`กรุณากรอกรหัสยืนยัน "${expectedCode}" ให้ตรงกัน`)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(target.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm_text: values.confirm_text,
          reason: values.reason || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "ลบบัญชีไม่สำเร็จ")

      toast.success("ลบบัญชีและข้อมูลทั้งหมดเรียบร้อยแล้ว", {
        description: `${target.full_name || target.email || expectedCode} (ออเดอร์ ${data.deleted?.orders || 0}, คำขอ ${data.deleted?.inquiries || 0})`,
      })
      setCustomerToDelete(null)
      await fetchCustomers(currentPage, submittedSearch, activeTab)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "ลบบัญชีไม่สำเร็จ")
    } finally {
      setDeleting(false)
    }
  }

  const expectedDeleteCode = customerToDelete?.customer_code?.trim() || "DELETE"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" aria-hidden="true" />
            จัดการข้อมูลลูกค้า
          </h1>
          <p className="text-slate-500 mt-1">รายชื่อ ช่องทางเข้าสู่ระบบ และจัดการลบบัญชีทดสอบอย่างสะอาด</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeTab === "customers" ? "default" : "outline"}
            onClick={() => handleTabChange("customers")}
            className="min-h-11 rounded-xl font-bold cursor-pointer"
          >
            ลูกค้าทั้งหมด
          </Button>
          <Button
            type="button"
            variant={activeTab === "orphans" ? "default" : "outline"}
            onClick={() => handleTabChange("orphans")}
            className="min-h-11 rounded-xl font-bold cursor-pointer"
          >
            บัญชีค้างไม่มีโปรไฟล์
            {orphanCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">
                {orphanCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                aria-label="ค้นหาลูกค้า"
                placeholder="ค้นหา รหัสลูกค้า, ชื่อ, เบอร์โทร, LINE ID... (กด Enter)"
                className="pl-9 h-11 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="min-h-11 px-4 font-bold cursor-pointer">
              ค้นหา
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        {loadError && (
          <div className="m-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={() => fetchCustomers()}>
              ลองใหม่
            </Button>
          </div>
        )}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-5 py-4 font-semibold">รหัส / ช่องทาง</th>
                      <th className="px-5 py-4 font-semibold">ชื่อ / อีเมล</th>
                      <th className="px-5 py-4 font-semibold">ติดต่อ (โทร / LINE)</th>
                      <th className="px-5 py-4 font-semibold text-center">ข้อมูลใช้งาน</th>
                      <th className="px-5 py-4 font-semibold">วันที่สมัคร</th>
                      <th className="px-5 py-4 font-semibold text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customers.length > 0 ? (
                      customers.map((customer) => {
                        const provider = getProviderBadge(customer.auth_provider)
                        return (
                          <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 space-y-1.5">
                              <div>
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                  {customer.customer_code || "ไม่มีโปรไฟล์"}
                                </span>
                              </div>
                              <div>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${provider.className}`}>
                                  {provider.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800">{customer.full_name || "ไม่มีชื่อ"}</p>
                              {customer.email && (
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.email}</p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-600 text-xs space-y-1">
                              <div>โทร: {customer.phone || "-"}</div>
                              <div>LINE: {customer.line_id || (customer.line_uid ? "เชื่อม LINE แล้ว" : "-")}</div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {customer.orders_count} ออเดอร์ / {customer.inquiries_count} คำขอ / {customer.shipments_count} พัสดุ
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                              {formatBangkokDateTime(customer.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {activeTab === "customers" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200 cursor-pointer"
                                    onClick={() => {
                                      setSelectedCustomerForInquiry(customer)
                                      setIsCreateInquiryModalOpen(true)
                                    }}
                                  >
                                    <PlusCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                                    สร้างคำขอราคา
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  aria-label={`ลบบัญชี ${customer.customer_code || customer.full_name || customer.id}`}
                                  className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                                  onClick={() => setCustomerToDelete(customer)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                  ลบบัญชี
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 opacity-20" />
                            <p>ไม่พบข้อมูลบัญชีในหมวดนี้</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y md:hidden">
                {customers.map((customer) => {
                  const provider = getProviderBadge(customer.auth_provider)
                  return (
                    <div key={customer.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-primary">
                              {customer.customer_code || "ไม่มีโปรไฟล์"}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${provider.className}`}>
                              {provider.label}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900">{customer.full_name || "ไม่มีชื่อ"}</div>
                          {customer.email && (
                            <div className="text-xs text-slate-500 font-mono">{customer.email}</div>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          {formatBangkokShortDate(customer.created_at)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {customer.phone ? (
                          <a className="rounded-lg border p-2 text-center min-h-11 inline-flex items-center justify-center hover:bg-slate-50" href={`tel:${customer.phone}`}>
                            โทร {customer.phone}
                          </a>
                        ) : (
                          <div className="rounded-lg border p-2 text-center min-h-11 inline-flex items-center justify-center text-slate-400">
                            โทร -
                          </div>
                        )}
                        <div className="rounded-lg border p-2 text-center min-h-11 inline-flex items-center justify-center text-xs font-semibold text-slate-600">
                          {customer.orders_count} ออเดอร์ / {customer.inquiries_count} คำขอ
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === "customers" && (
                          <Button
                            className="flex-1 min-h-11"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomerForInquiry(customer)
                              setIsCreateInquiryModalOpen(true)
                            }}
                          >
                            <PlusCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                            สร้างคำขอราคา
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 px-4 cursor-pointer"
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
                          ลบบัญชี
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {customers.length === 0 && (
                  <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลบัญชีในหมวดนี้</div>
                )}
              </div>
            </>
          )}

          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-slate-500">
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จากทั้งหมด {totalCount} รายการ
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
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

      <ConfirmDialog
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        variant="destructive"
        loading={deleting}
        title="ยืนยันการลบบัญชีลูกค้าอย่างถาวร (ลบสะอาด)"
        description={
          customerToDelete
            ? `กำลังจะลบบัญชี "${customerToDelete.full_name || customerToDelete.email || expectedDeleteCode}" (${customerToDelete.customer_code || "ไม่มีโปรไฟล์"})\n\nระบบจะลบข้อมูลที่ผูกอยู่ทั้งหมดอย่างถาวรและกู้คืนไม่ได้:\n• ออเดอร์ ${customerToDelete.orders_count} รายการ, คำขอราคา ${customerToDelete.inquiries_count} รายการ, พัสดุ ${customerToDelete.shipments_count} รายการ\n• สลิปโอนเงิน, รูปภาพสินค้า, ที่อยู่, ประวัติแจ้งเตือน และบัญชี Auth`
            : ""
        }
        confirmLabel="ยืนยันลบบัญชีถาวร"
        fields={[
          {
            name: "confirm_text",
            label: `พิมพ์ "${expectedDeleteCode}" เพื่อยืนยัน`,
            placeholder: expectedDeleteCode,
            required: true,
          },
          {
            name: "reason",
            label: "เหตุผลในการลบ (บันทึกใน Audit Log)",
            placeholder: "เช่น บัญชีทดสอบระบบ / ลูกค้าขอลบบัญชี",
            required: false,
          },
        ]}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
