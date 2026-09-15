"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, AlertTriangle, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"

export function ExcelUploadModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successCount, setSuccessCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setErrorMsg("")
      setParsedData([])
      parseExcel(selectedFile)
    }
  }

  const parseExcel = async (file: File) => {
    setLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        throw new Error("ไม่พบข้อมูลในไฟล์ Excel")
      }
      
      // Filter out empty rows
      const validData = jsonData.filter((row: any) => row['รหัสลูกค้า'] || row['เลขแทรค'])
      setParsedData(validData)
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการอ่านไฟล์")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) return
    setUploading(true)
    setErrorMsg("")
    let uploadedCount = 0

    try {
      const rows = parsedData.map((row, index) => {
        const shipmentData = {
          customer_code: row['รหัสลูกค้า']?.toString().trim() || "",
          transport_type: row['ขนส่ง']?.toString(),
          tracking_number: row['เลขแทรค']?.toString().trim() || "",
          product_type: row['ประเภทสินค้า']?.toString(),
          product_name: row['ชื่อสินค้า']?.toString(),
          container_date: row['วันที่ขึ้นตู้']?.toString(),
          quantity: row['จำนวนชิ้น']?.toString() || "",
          weight: row['น้ำหนัก']?.toString() || "",
          arrival_date: row['วันที่ถึงไทย']?.toString(),
          shipping_cost: row['ราคาค่าส่ง']?.toString(),
          shipping_cost_amount: row['ราคาค่าส่ง']?.toString().replace(/[^0-9.]/g, '') || "",
          width: row['กว้าง']?.toString() || "",
          length: row['ยาว']?.toString() || "",
          height: row['สูง']?.toString() || "",
        }
        if (!shipmentData.customer_code || !shipmentData.tracking_number) {
          throw new Error(`แถวที่ ${index + 2} ไม่มีรหัสลูกค้าหรือเลขแทรค`)
        }
        for (const [field, value] of Object.entries({
          quantity: shipmentData.quantity,
          weight: shipmentData.weight,
          shipping_cost_amount: shipmentData.shipping_cost_amount,
          width: shipmentData.width,
          length: shipmentData.length,
          height: shipmentData.height,
        })) {
          if (value && (!Number.isFinite(Number(value)) || Number(value) < 0 || (field === "quantity" && !Number.isInteger(Number(value))))) {
            throw new Error(`แถวที่ ${index + 2} ช่อง ${field} ไม่ใช่ตัวเลขที่ถูกต้อง`)
          }
        }
        return shipmentData
      })

      const response = await fetch("/api/admin/shipments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: file?.name || "shipments.xlsx", rows }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "ไม่สามารถนำเข้าข้อมูลได้")
      uploadedCount = Number(result.data?.imported_rows || 0)

      setSuccessCount(uploadedCount)
      if (onSuccess) onSuccess()

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedData([])
    setSuccessCount(0)
    setErrorMsg("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            อัปโหลดไฟล์ Excel (สถานะการจัดส่ง)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {successCount > 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">อัปโหลดสำเร็จ!</h3>
              <p className="text-slate-500">นำเข้าข้อมูลทั้งหมด {successCount} รายการ</p>
              <Button onClick={handleClose} className="mt-4">ปิดหน้าต่าง</Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">เลือกไฟล์ Excel (.xlsx, .csv)</label>
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileChange}
                    disabled={loading || uploading}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  รองรับคอลัมน์: รหัสลูกค้า, ขนส่ง, เลขแทรค, ประเภทสินค้า, ชื่อสินค้า, วันที่ขึ้นตู้, น้ำหนัก, วันที่ถึงไทย, ราคาค่าส่ง ฯลฯ
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2 border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังอ่านไฟล์...
                </div>
              )}

              {parsedData.length > 0 && !loading && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">ตัวอย่างข้อมูล ({parsedData.length} รายการ)</h4>
                  </div>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-3 py-2 font-semibold">รหัสลูกค้า</th>
                          <th className="px-3 py-2 font-semibold">เลขแทรค</th>
                          <th className="px-3 py-2 font-semibold">ชื่อสินค้า</th>
                          <th className="px-3 py-2 font-semibold">น้ำหนัก</th>
                          <th className="px-3 py-2 font-semibold">ค่าส่ง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium">{row['รหัสลูกค้า'] || "-"}</td>
                            <td className="px-3 py-2">{row['เลขแทรค'] || "-"}</td>
                            <td className="px-3 py-2 truncate max-w-[150px]">{row['ชื่อสินค้า'] || "-"}</td>
                            <td className="px-3 py-2">{row['น้ำหนัก'] || "-"}</td>
                            <td className="px-3 py-2 text-green-600">{row['ราคาค่าส่ง'] || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 5 && (
                    <p className="text-xs text-center text-slate-500 italic">และอีก {parsedData.length - 5} รายการ...</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {successCount === 0 && (
          <div className="pt-4 border-t flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>ยกเลิก</Button>
            <Button 
              onClick={handleUpload} 
              disabled={parsedData.length === 0 || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังนำเข้าข้อมูล...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  ยืนยันนำเข้าข้อมูล
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
