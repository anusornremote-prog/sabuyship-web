"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Sparkles, AlertTriangle, FileQuestion, ArrowRight, ShieldCheck, MapPin, Phone, User, Building } from "lucide-react"
import { toast } from "sonner"

interface CustomerWarehouseCardProps {
  customerCode: string
}

export function CustomerWarehouseCard({ customerCode }: CustomerWarehouseCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const consigneeName = `傅先生 ${customerCode}`
  const phone = "18602069827"
  const zipCode = "510470"
  const address = `广东省广州市白云区人和镇人和大街68号（万宝集团）进大门右转直走到底61号仓（泰国专线仓库） (${customerCode})`

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`คัดลอก${fieldName}แล้ว`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Card className="border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white shadow-md rounded-2xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols): Customer Code & Instructions */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Logistics Account
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                รหัสสมาชิกลูกค้าของคุณ
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="px-4 py-2 bg-white rounded-xl border-2 border-primary/30 shadow-sm">
                  <span className="text-3xl font-black text-primary tracking-wider font-mono">
                    {customerCode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(customerCode, "รหัสลูกค้า")}
                  className="h-11 px-3.5 rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs"
                >
                  {copiedField === "รหัสลูกค้า" ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Check className="w-4 h-4" /> คัดลอกแล้ว
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Copy className="w-4 h-4" /> คัดลอกรหัส
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-white/90 rounded-xl border border-blue-100 space-y-2 text-xs text-slate-600 leading-relaxed shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                วิธีระบุข้อมูลสั่งซื้อกับร้านจีน
              </div>
              <p>
                ในการสั่งซื้อสินค้าผ่าน Taobao, 1688 หรือส่งของเข้าโกดังจีน ให้กรอกข้อมูลผู้รับและที่อยู่ตามข้อมูลในกล่องขวามือนี้ทุกครั้ง
              </p>
            </div>

            <div>
              <Link href="/inquiry">
                <Button variant="orange" className="w-full h-11 text-sm font-bold rounded-xl shadow-md cursor-pointer">
                  <FileQuestion className="w-4 h-4 mr-2" />
                  ขอใบเสนอราคาสินค้าใหม่
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): Warehouse Address with Individual Copy Buttons */}
          <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <span>🇨🇳</span> ที่อยู่โกดังจีน (กวางโจว) สำหรับสั่งสินค้า
              </h3>
              <span className="text-[10px] font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Guangzhou Warehouse
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Consignee */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ผู้รับ (Consignee Name / 收件人)
                  </span>
                  <span className="font-bold text-slate-900 text-sm block truncate font-mono">
                    {consigneeName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(consigneeName, "ชื่อผู้รับ")}
                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-primary shrink-0 cursor-pointer"
                >
                  {copiedField === "ชื่อผู้รับ" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* Phone & Zipcode row */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      เบอร์โทรศัพท์ (Phone / 电话)
                    </span>
                    <span className="font-bold text-slate-900 text-sm block truncate font-mono">
                      {phone}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(phone, "เบอร์โทรศัพท์")}
                    className="h-8 px-2 text-xs text-slate-600 hover:text-primary shrink-0 cursor-pointer"
                  >
                    {copiedField === "เบอร์โทรศัพท์" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      รหัสไปรษณีย์ (Zip Code / 邮编)
                    </span>
                    <span className="font-bold text-slate-900 text-sm block truncate font-mono">
                      {zipCode}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(zipCode, "รหัสไปรษณีย์")}
                    className="h-8 px-2 text-xs text-slate-600 hover:text-primary shrink-0 cursor-pointer"
                  >
                    {copiedField === "รหัสไปรษณีย์" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Detailed Address */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ที่อยู่โกดัง (Detailed Address / 详细地址)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(address, "ที่อยู่โกดัง")}
                    className="h-7 px-2 text-xs text-primary font-bold hover:bg-blue-50 shrink-0 cursor-pointer"
                  >
                    {copiedField === "ที่อยู่โกดัง" ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-3.5 h-3.5" /> คัดลอกแล้ว
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> คัดลอกที่อยู่ทั้งหมด
                      </span>
                    )}
                  </Button>
                </div>
                <p className="font-mono text-xs text-slate-800 leading-relaxed break-words bg-white p-2.5 rounded-lg border border-slate-200/80">
                  {address}
                </p>
              </div>

              {/* Warning box */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  กรุณาแจ้งร้านค้าให้ติดรหัสลูกค้า ({customerCode}) ข้างกล่องพัสดุให้ชัดเจน
                  <span className="block text-[11px] font-normal opacity-90 mt-0.5">
                    (外包装上请务必写上入仓唛头: {customerCode})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
