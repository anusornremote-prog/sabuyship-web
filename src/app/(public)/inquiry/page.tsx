"use client"

import imageCompression from 'browser-image-compression'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"
import { 
  ShoppingCart, 
  Truck, 
  Ship, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  Globe, 
  ShieldCheck,
  ArrowRight,
  Package,
  Search
} from "lucide-react"
import { toast } from "sonner"

export default function InquiryForm() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdInquiryNumber, setCreatedInquiryNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; line_id?: string } | null>(null)
  const [serviceType, setServiceType] = useState<'BUY_AND_IMPORT' | 'IMPORT_ONLY'>('BUY_AND_IMPORT')
  const [items, setItems] = useState<{ url: string; quantity: number | string; remark: string; file: File | null; wooden_crate?: boolean; china_tracking_number?: string }[]>([
    { url: '', quantity: 1, remark: '', file: null, wooden_crate: false, china_tracking_number: '' }
  ])

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsLoggedIn(true)
          const { data } = await supabase
            .from("profiles")
            .select("full_name, phone, line_uid")
            .eq("id", user.id)
            .maybeSingle()
          if (data) {
            setProfile({
              full_name: data.full_name || '',
              phone: data.phone || '',
              line_id: ''
            })
          }
        }
      } catch (err) {
        console.error("Error checking auth in inquiry:", err)
      }
    }
    checkUser()
  }, [])

  const handleCopyOrderNumber = () => {
    if (!createdInquiryNumber) return
    navigator.clipboard.writeText(createdInquiryNumber)
    setCopied(true)
    toast.success(locale === 'zh' ? "订单号已复制" : locale === 'en' ? "Order ID copied" : "คัดลอกรหัสคำขอแล้ว")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddItem = () => {
    setItems([...items, { url: '', quantity: 1, remark: '', file: null, wooden_crate: false, china_tracking_number: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate items based on serviceType
    if (serviceType === 'BUY_AND_IMPORT') {
      if (items.some(item => !item.url.trim())) {
        setError(locale === 'en' ? 'Please fill in all product URLs.' : locale === 'zh' ? '请填写所有商品链接。' : 'กรุณากรอกลิงก์สินค้าให้ครบทุกรายการ')
        return
      }
    } else {
      if (items.some(item => !item.china_tracking_number?.trim())) {
        setError(locale === 'en' ? 'Please fill in China tracking numbers.' : locale === 'zh' ? '请填写中国快递单号。' : 'กรุณากรอกเลขพัสดุจีนให้ครบทุกรายการ')
        return
      }
    }

    const formData = new FormData(e.currentTarget)
    
    if (!formData.get("shippingType")) {
      setError(locale === 'en' ? 'Please select a shipping method.' : locale === 'zh' ? '请选择运输方式。' : 'กรุณาเลือกรูปแบบการขนส่ง')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Upload images if any
      const uploadedItems = await Promise.all(items.map(async (item, idx) => {
        let image_url = null
        if (item.file) {
          const options = {
            maxSizeMB: 0.1, // ~100KB limit
            maxWidthOrHeight: 800,
            useWebWorker: true,
            initialQuality: 0.5
          }
          let fileToUpload = item.file
          try {
            fileToUpload = await imageCompression(item.file, options)
          } catch (error) {
            console.error("Compression error:", error)
          }
          
          const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
          const fileName = `${Date.now()}-${idx}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('inquiries')
            .upload(fileName, fileToUpload, {
               cacheControl: '3600',
               upsert: false
            })
          
          if (uploadError) throw new Error(`Upload failed for item ${idx + 1}: ${uploadError.message}`)
          
          const { data: { publicUrl } } = supabase.storage
            .from('inquiries')
            .getPublicUrl(fileName)
            
          image_url = publicUrl
        }
        
        return {
          url: item.url,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity,
          remark: item.remark,
          wooden_crate: item.wooden_crate,
          china_tracking_number: item.china_tracking_number || null,
          image_url
        }
      }))

      const payload = {
        customer_name: formData.get("customerName"),
        phone: formData.get("phone"),
        line_id: formData.get("lineId"),
        shipping_type: formData.get("shippingType"),
        service_type: serviceType,
        items: uploadedItems
      }

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit inquiry")
      }

      setCreatedInquiryNumber(result.inquiry_number || "ORD-SUCCESS")
      setSuccess(true)
      setItems([{ url: '', quantity: 1, remark: '', file: null, wooden_crate: false, china_tracking_number: '' }])
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Confirmation Screen
  if (success) {
    return (
      <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-lg w-full shadow-xl rounded-3xl text-center p-8 bg-white border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            {locale === 'en' ? 'Submission Successful' : locale === 'zh' ? '提交成功' : 'ส่งคำขอสำเร็จเรียบร้อย'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            {locale === 'en' ? 'Quotation Request Received!' : locale === 'zh' ? '已收到您的询价申请！' : 'ทีมงานได้รับลิงก์สินค้าแล้ว!'}
          </h2>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {locale === 'en' 
              ? 'Our sourcing team is verifying stock and negotiating factory pricing. We will issue your quotation within 1-2 hours.' 
              : locale === 'zh'
              ? '我们的代购团队正在核实库存并为您洽谈厂家批发价，将在1-2小时内出具报价单。'
              : 'ทีมงานกำลังตรวจสอบสต็อกและเจรจาต่อรองราคากับร้านค้าจีนให้ฟรี และจะแจ้งใบเสนอราคาให้คุณทราบโดยเร็วที่สุด'}
          </p>

          {/* Order ID Box */}
          {createdInquiryNumber && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {locale === 'en' ? 'Your Request ID' : locale === 'zh' ? '您的询价单号' : 'หมายเลขคำขอของคุณ'}
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black text-primary font-mono tracking-wider">
                  {createdInquiryNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 cursor-pointer shadow-2xs transition-colors"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {locale === 'en' ? '*You can track status anytime with this ID on our Track page' : locale === 'zh' ? '*您可随时使用此单号在“追踪订单”页面查询进度' : '*สามารถใช้รหัสนี้ตรวจสอบสถานะได้ตลอด 24 ชม. ที่หน้าระบบติดตาม'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isLoggedIn ? (
              <Link href="/dashboard/orders" className="block">
                <Button size="lg" className="w-full h-12 font-bold text-base bg-primary text-white hover:bg-primary/90 rounded-xl cursor-pointer shadow-md">
                  <Package className="w-5 h-5 mr-2" />
                  {locale === 'en' ? 'View My Orders' : locale === 'zh' ? '查看我的订单' : 'ดูรายการคำสั่งซื้อของฉัน ➔'}
                </Button>
              </Link>
            ) : (
              <>
                <Link href={`/track?id=${createdInquiryNumber}`} className="block">
                  <Button size="lg" variant="orange" className="w-full h-12 font-bold text-base rounded-xl cursor-pointer shadow-md">
                    <Search className="w-5 h-5 mr-2" />
                    {locale === 'en' ? 'Track Request Status' : locale === 'zh' ? '查询此单进度' : 'ติดตามสถานะคำขอนี้ ➔'}
                  </Button>
                </Link>

                <Link href="/login" className="block">
                  <Button size="lg" variant="outline" className="w-full h-12 font-bold text-sm rounded-xl cursor-pointer">
                    {locale === 'en' ? 'Log in / Register Account' : locale === 'zh' ? '登录 / 注册会员账户' : 'เข้าสู่ระบบ / สมัครสมาชิก'}
                  </Button>
                </Link>
              </>
            )}

            <Button 
              variant="ghost" 
              onClick={() => setSuccess(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {locale === 'en' ? '+ Submit Another Request' : locale === 'zh' ? '+ 提交其他新商品' : '+ ส่งคำขอรายการอื่นเพิ่ม'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-16 md:py-24 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {locale === 'en' ? '0% Free Sourcing Fee' : locale === 'zh' ? '0% 免费代购服务' : 'ฟรีค่าบริการกดสั่ง 0 บาท'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {locale === 'en' ? 'Submit Product Link for Quote' : locale === 'zh' ? '发送商品链接 免费获取报价' : 'ส่งลิงก์สินค้า ขอใบเสนอราคาฟรี'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {locale === 'en' 
              ? 'Paste links from 1688, Taobao, Tmall, or Pinduoduo. Our team will verify stock and calculate THB pricing.'
              : locale === 'zh'
              ? '粘贴 1688、淘宝、天猫或拼多多链接，客服免费为您核算价格与运费。'
              : 'แปะลิงก์จาก 1688, Taobao, Tmall หรือระบุรายละเอียด ทีมงานช่วยต่อรองราคาส่งและคำนวณเงินบาทให้ฟรี'}
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="border border-slate-200 shadow-xl rounded-3xl bg-white overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Service Type Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {locale === 'en' ? '1. Select Service Type' : locale === 'zh' ? '1. 选择服务类型' : '1. เลือกประเภทบริการ'}
                </label>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <label className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                    serviceType === 'BUY_AND_IMPORT' 
                      ? 'border-primary bg-blue-50/60 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="serviceType" 
                        value="BUY_AND_IMPORT" 
                        checked={serviceType === 'BUY_AND_IMPORT'} 
                        onChange={() => setServiceType('BUY_AND_IMPORT')} 
                        className="w-4 h-4 text-primary mt-1 accent-primary" 
                      />
                      <div>
                        <div className="font-black text-slate-900 text-sm sm:text-base">
                          {locale === 'en' ? 'Order & Import (Recommended)' : locale === 'zh' ? '代购 + 进口 (推荐)' : 'ฝากสั่งซื้อ + นำเข้า (แนะนำ)'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {locale === 'en' ? 'Paste product URL, we buy from China supplier for you' : locale === 'zh' ? '提供链接，我们为您代购并把控流程' : 'ใส่ลิงก์สินค้า เราดูแลคุยร้านจีน สั่งซื้อ และนำเข้าให้ครบ'}
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                    serviceType === 'IMPORT_ONLY' 
                      ? 'border-primary bg-blue-50/60 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="serviceType" 
                        value="IMPORT_ONLY" 
                        checked={serviceType === 'IMPORT_ONLY'} 
                        onChange={() => setServiceType('IMPORT_ONLY')} 
                        className="w-4 h-4 text-primary mt-1 accent-primary" 
                      />
                      <div>
                        <div className="font-black text-slate-900 text-sm sm:text-base">
                          {locale === 'en' ? 'Import Only (Self-Purchased)' : locale === 'zh' ? '仅进口 (客户自行下单)' : 'ลูกค้านำเข้าเอง (ส่งเข้าโกดังจีน)'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {locale === 'en' ? 'You buy directly, just provide China tracking number' : locale === 'zh' ? '您自行向商家购买，仅需提供中国快递单号' : 'ลูกค้ากดสั่งเอง ใส่เลขพัสดุจีนเพื่อให้เรานำเข้าสู่ไทย'}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Product Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {locale === 'en' ? '2. Product Links & Details' : locale === 'zh' ? '2. 商品信息与规格' : '2. รายการสินค้าที่ต้องการสั่งซื้อ'}
                  </label>
                  <span className="text-xs text-slate-400 font-bold">
                    {items.length} {locale === 'en' ? 'Items' : locale === 'zh' ? '件' : 'รายการ'}
                  </span>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {locale === 'en' ? `Item #${index + 1}` : locale === 'zh' ? `商品 #${index + 1}` : `สินค้าชิ้นที่ ${index + 1}`}
                        </span>

                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            {locale === 'en' ? 'Remove' : locale === 'zh' ? '删除' : 'ลบรายการนี้'}
                          </Button>
                        )}
                      </div>

                      {serviceType === 'BUY_AND_IMPORT' ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            {locale === 'en' ? 'Product URL (1688 / Taobao / Tmall) *' : locale === 'zh' ? '商品链接 (1688 / 淘宝 / 天猫) *' : 'ลิงก์สินค้า (Taobao / 1688 / Tmall) *'}
                          </label>
                          <Input 
                            type="url" 
                            placeholder="https://detail.1688.com/offer/..." 
                            value={item.url}
                            onChange={(e) => handleItemChange(index, 'url', e.target.value)}
                            required
                            className="h-11 rounded-xl bg-white border-slate-300 font-mono text-xs sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            {locale === 'en' ? 'China Domestic Tracking Number *' : locale === 'zh' ? '中国国内快递单号 *' : 'เลขพัสดุจีน (China Tracking Number) *'}
                          </label>
                          <Input 
                            type="text" 
                            placeholder="เช่น 77329849204..." 
                            value={item.china_tracking_number || ''}
                            onChange={(e) => handleItemChange(index, 'china_tracking_number', e.target.value)}
                            required
                            className="h-11 rounded-xl bg-white border-slate-300 font-mono text-xs sm:text-sm"
                          />
                        </div>
                      )}

                      {/* Quantity & Remark Row */}
                      <div className="grid sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            {locale === 'en' ? 'Quantity *' : locale === 'zh' ? '数量 *' : 'จำนวนที่ต้องการ *'}
                          </label>
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            className="h-11 rounded-xl bg-white text-center font-bold"
                          />
                        </div>

                        <div className="sm:col-span-8 space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            {locale === 'en' ? 'Remarks (Color, Size, Option)' : locale === 'zh' ? '规格备注 (颜色、尺码、型号)' : 'ระบุสี / ไซส์ / แบบที่ต้องการ'}
                          </label>
                          <Input 
                            type="text" 
                            placeholder={locale === 'en' ? 'e.g. Black color, size L' : locale === 'zh' ? '如：黑色 L码' : 'เช่น สีดำ ไซส์ L อย่างละ 2 ชิ้น'} 
                            value={item.remark}
                            onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
                            className="h-11 rounded-xl bg-white text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      {/* Image Upload & Wooden Crate Checkbox */}
                      <div className="grid sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            {locale === 'en' ? 'Attach Product Image (Optional)' : locale === 'zh' ? '上传商品截图 (可选)' : 'แนบรูปภาพสินค้า (ถ้ามี)'}
                          </label>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleItemChange(index, 'file', e.target.files?.[0] || null)}
                            className="h-11 rounded-xl bg-white text-xs cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary"
                          />
                        </div>

                        <div className="flex items-center gap-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl mt-auto">
                          <input 
                            type="checkbox"
                            id={`crate-${index}`}
                            checked={item.wooden_crate || false}
                            onChange={(e) => handleItemChange(index, 'wooden_crate', e.target.checked)}
                            className="w-4 h-4 rounded border-amber-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                          />
                          <label htmlFor={`crate-${index}`} className="text-xs font-bold text-amber-900 cursor-pointer">
                            {locale === 'en' ? 'Wooden crate packing (+200 THB)' : locale === 'zh' ? '需要打木架加固 (+200泰铢)' : 'บริการเสริมตีลังไม้ (+200 บาท)'}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  className="w-full h-11 border-dashed border-2 border-slate-300 hover:border-primary hover:bg-blue-50/50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {locale === 'en' ? '+ Add Another Item' : locale === 'zh' ? '+ 添加更多商品' : '+ เพิ่มรายการสินค้าอีก 1 ชิ้น'}
                </Button>
              </div>

              {/* 3. Shipping Channel Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {locale === 'en' ? '3. Select Shipping Method (China to Thailand)' : locale === 'zh' ? '3. 选择跨境运输方式' : '3. เลือกช่องทางการขนส่ง (จีน-ไทย)'}
                </label>

                <div className="grid grid-cols-2 gap-3.5">
                  <label className="border-2 rounded-2xl p-4 cursor-pointer transition-all border-slate-200 hover:border-orange-400 has-checked:border-orange-500 has-checked:bg-orange-50/60 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="shippingType" 
                        value="CAR" 
                        defaultChecked
                        className="w-4 h-4 text-orange-600 mt-1 accent-orange-600" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm sm:text-base">
                          <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>{locale === 'en' ? 'Express Road (EK)' : locale === 'zh' ? '特快陆运 (EK)' : 'ทางรถด่วน (EK)'}</span>
                        </div>
                        <div className="text-xs text-orange-700 font-bold mt-1">
                          {locale === 'en' ? '5 - 7 Business Days' : locale === 'zh' ? '5 - 7 工作日送达' : 'ระยะเวลา 5 - 7 วันถึงไทย'}
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="border-2 rounded-2xl p-4 cursor-pointer transition-all border-slate-200 hover:border-blue-400 has-checked:border-blue-600 has-checked:bg-blue-50/60 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <input 
                        type="radio" 
                        name="shippingType" 
                        value="BOAT" 
                        className="w-4 h-4 text-blue-600 mt-1 accent-blue-600" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm sm:text-base">
                          <Ship className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{locale === 'en' ? 'Economy Sea (SEA)' : locale === 'zh' ? '经济海运 (SEA)' : 'ทางเรือประหยัด (SEA)'}</span>
                        </div>
                        <div className="text-xs text-blue-700 font-bold mt-1">
                          {locale === 'en' ? '15 - 20 Business Days' : locale === 'zh' ? '15 - 20 工作日送达' : 'ระยะเวลา 15 - 20 วันถึงไทย'}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Contact Information Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  {locale === 'en' ? '4. Contact Details for Quotation' : locale === 'zh' ? '4. 接收报价的联系方式' : '4. ข้อมูลสำหรับรับใบเสนอราคา'}
                </label>

                <div className="grid sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {locale === 'en' ? 'Full Name *' : locale === 'zh' ? '您的姓名 *' : 'ชื่อ-นามสกุลของคุณ *'}
                    </label>
                    <Input 
                      type="text" 
                      name="customerName"
                      placeholder={locale === 'en' ? 'John Doe' : locale === 'zh' ? '例如：张先生' : 'เช่น คุณสมชาย'} 
                      defaultValue={profile?.full_name || ''}
                      required
                      className="h-11 rounded-xl bg-white font-medium text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {locale === 'en' ? 'Phone Number *' : locale === 'zh' ? '手机号码 *' : 'เบอร์โทรศัพท์ติดต่อ *'}
                    </label>
                    <Input 
                      type="tel" 
                      name="phone"
                      placeholder="08X-XXX-XXXX" 
                      defaultValue={profile?.phone || ''}
                      required
                      className="h-11 rounded-xl bg-white font-medium text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {locale === 'en' ? 'LINE ID / WeChat (Optional)' : locale === 'zh' ? 'LINE ID / 微信 (可选)' : 'LINE ID (แนะนำ)'}
                    </label>
                    <Input 
                      type="text" 
                      name="lineId"
                      placeholder="@yourlineid" 
                      defaultValue={profile?.line_id || ''}
                      className="h-11 rounded-xl bg-white font-medium text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  variant="orange" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-base sm:text-lg font-black rounded-2xl shadow-lg shadow-orange-500/25 cursor-pointer hover:shadow-orange-500/35 transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{locale === 'en' ? 'Submitting Request...' : locale === 'zh' ? '正在提交申请...' : 'กำลังส่งคำขอใบเสนอราคา...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>{locale === 'en' ? 'Submit for Free Quotation ➔' : locale === 'zh' ? '免费获取报价 ➔' : 'ส่งลิงก์ ขอใบเสนอราคาฟรี ➔'}</span>
                    </div>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-3">
                  {locale === 'en' 
                    ? '🔒 Free quotation service. 0% purchasing service fee without obligation.' 
                    : locale === 'zh'
                    ? '🔒 免费询价与价格评估，无代购手续费，无需任何预付款。'
                    : '🔒 บริการประเมินราคาฟรี ไม่มีค่ากดสั่งซื้อ 0 บาท ไม่มีข้อผูกมัดใดๆ'}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
