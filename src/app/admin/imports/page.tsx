import Link from "next/link"
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 25

export default async function ShipmentImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: batches, count, error } = await supabase
    .from("shipment_import_batches")
    .select(
      "id, file_name, total_rows, imported_rows, failed_rows, created_at, creator:created_by(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  const totalCount = count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <FileSpreadsheet className="h-6 w-6 text-primary" aria-hidden="true" />
          <span>ประวัตินำเข้า Excel</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ตรวจสอบไฟล์ จำนวนแถว และผู้ดำเนินการย้อนหลัง (ทั้งหมด {totalCount} รายการ)
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            หน้าที่ {currentPage} / {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-rose-600">โหลดประวัติไม่สำเร็จ</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3">วันเวลา</th>
                      <th className="px-4 py-3">ไฟล์</th>
                      <th className="px-4 py-3">ผลลัพธ์</th>
                      <th className="px-4 py-3">ผู้ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(batches || []).map((batch: any) => (
                      <tr key={batch.id}>
                        <td className="whitespace-nowrap px-4 py-3">
                          {new Date(batch.created_at).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium break-all">{batch.file_name}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-700">{batch.imported_rows}</span>{" "}
                          / {batch.total_rows}
                          {batch.failed_rows > 0 ? (
                            <span className="ml-2 text-rose-600">
                              (ผิดพลาด {batch.failed_rows})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{batch.creator?.full_name || "-"}</td>
                      </tr>
                    ))}
                    {!batches?.length && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-500">
                          ยังไม่มีประวัตินำเข้า
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {(batches || []).map((batch: any) => (
                  <div key={batch.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-slate-900 break-all">
                        {batch.file_name}
                      </p>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {batch.imported_rows}/{batch.total_rows}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        {new Date(batch.created_at).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                        })}
                      </span>
                      <span>โดย: {batch.creator?.full_name || "-"}</span>
                    </div>
                    {batch.failed_rows > 0 && (
                      <p className="text-xs font-semibold text-rose-600">
                        ผิดพลาด {batch.failed_rows} แถว
                      </p>
                    )}
                  </div>
                ))}
                {!batches?.length && (
                  <div className="p-10 text-center text-sm text-slate-500">
                    ยังไม่มีประวัตินำเข้า
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <Link
                    href={`/admin/imports?page=${Math.max(1, currentPage - 1)}`}
                    aria-disabled={currentPage <= 1}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    <Button variant="outline" size="sm" className="min-h-10 gap-1 rounded-xl">
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      <span>ก่อนหน้า</span>
                    </Button>
                  </Link>
                  <span className="text-xs font-semibold text-slate-600">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <Link
                    href={`/admin/imports?page=${Math.min(totalPages, currentPage + 1)}`}
                    aria-disabled={currentPage >= totalPages}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  >
                    <Button variant="outline" size="sm" className="min-h-10 gap-1 rounded-xl">
                      <span>ถัดไป</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
