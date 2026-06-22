"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertTriangle, Settings, Coins } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  const [exchangeRate, setExchangeRate] = useState("5.20")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "exchange_rate")
        .single()

      if (data && data.value) {
        setExchangeRate(data.value.toString())
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setErrorMsg("")

    try {
      const rate = parseFloat(exchangeRate)
      if (isNaN(rate) || rate <= 0) {
        throw new Error("กรุณาระบุเรทเงินให้ถูกต้อง")
      }

      const supabase = createClient()
      
      const { error } = await supabase
        .from("site_settings")
        .update({
          value: rate,
          updated_at: new Date().toISOString()
        })
        .eq("key", "exchange_rate")

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
        <p className="text-slate-600">จัดการการตั้งค่าต่างๆ ของเว็บไซต์</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            ตั้งค่าเรทเงิน (หยวน-บาท)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>บันทึกเรทเงินสำเร็จ</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">เรทเงิน 1 หยวน (THB) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">฿</span>
                <Input 
                  required
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="pl-8 text-lg font-bold"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                เรทนี้จะถูกนำไปใช้แสดงผลที่หน้าแรกของเว็บไซต์
              </p>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" className="px-8 cursor-pointer font-bold">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </div>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
