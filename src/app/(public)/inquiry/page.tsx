"use client"

import imageCompression from 'browser-image-compression'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"

export default function InquiryForm() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string } | null>(null)
  const [serviceType, setServiceType] = useState<'BUY_AND_IMPORT' | 'IMPORT_ONLY'>('BUY_AND_IMPORT')
  const [items, setItems] = useState<{ url: string; quantity: number | string; remark: string; file: File | null; wooden_crate?: boolean; china_tracking_number?: string }>([{ url: '', quantity: 1, remark: '', file: null, wooden_crate: false, china_tracking_number: '' }])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .single()
          if (data) {
            setProfile(data)
          }
          setIsCheckingAuth(false)
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error("Error fetching profile for inquiry:", err)
        router.push('/login')
      }
    }
    fetchProfile()
  }, [router])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>{locale === 'en' ? 'Checking authentication...' : locale === 'zh' ? '正在验证身份...' : 'กำลังตรวจสอบสิทธิ์การใช้งาน...'}</p>
        </div>
      </div>
    )
  }

  const labelContactInfo = locale === 'en' ? 'Contact Information' : locale === 'zh' ? '联系信息' : 'ข้อมูลผู้ติดต่อ'
  const labelContactSub = locale === 'en' ? 'Provide contact details so we can send the quotation' : locale === 'zh' ? '请提供联系方式以便我们发送报价单' : 'กรอกข้อมูลสินค้าและช่องทางติดต่อ เพื่อให้ทีมงานประเมินราคาและค่าขนส่ง'
  const labelProductInfo = locale === 'en' ? 'Product Information' : locale === 'zh' ? '商品信息' : 'ข้อมูลสินค้า'
  const labelProductUrl = locale === 'en' ? 'Product Link / Details *' : locale === 'zh' ? '商品链接 / 详情 *' : 'ลิงก์สินค้า หรือ ข้อมูลสินค้า *'
  const labelQuantity = locale === 'en' ? 'Quantity *' : locale === 'zh' ? '数量 *' : 'จำนวนที่ต้องการ *'
  const labelRemark = locale === 'en' ? 'Remarks / Specific details (Color, Size)' : locale === 'zh' ? '备注 / 规格详情 (颜色, 尺码)' : 'หมายเหตุ / รายละเอียดเพิ่มเติม (สี, ไซส์)'
  const labelRemarkPlaceholder = locale === 'en' ? 'e.g. Black color, size M, 2 pieces' : locale === 'zh' ? '例如：黑色 M码 2件' : 'เช่น เอาสีดำ ไซส์ M อย่างละ 2 ตัว'
  const labelLineId = locale === 'en' ? 'LINE ID / WeChat ID (Recommended)' : locale === 'zh' ? 'LINE ID / 微信 (推荐)' : 'LINE ID / WeChat ID (แนะนำ)'
  const labelSuccessTitle = locale === 'en' ? 'Submitted Successfully!' : locale === 'zh' ? '提交成功！' : 'ส่งคำขอสำเร็จ!'
  const labelSuccessDesc = locale === 'en' ? 'We have received your product link for quotation.\nOur team will review it and reply within 24 hours.' : locale === 'zh' ? '我们已收到您的报价申请。\n团队将审核并于24小时内与您联系。' : 'ทีมงานได้รับคำขอให้ประเมินราคาเรียบร้อยแล้ว\nเราจะทำการตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง'
  const labelViewOrders = locale === 'en' ? 'View Orders' : locale === 'zh' ? '查看订单' : 'ดูคำสั่งซื้อ'

  const handleAddItem = () => {
    setItems([...items, { url: '', quantity: 1, remark: '', file: null, wooden_crate: false, china_tracking_number: '' }])
  }

  const handleRemoveItem = (index: number) => {
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

    // Capture form data synchronously before any await
    const formData = new FormData(e.currentTarget)
    
    // Validate shipping type
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
          // Compress image before uploading
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
            // Fallback to original if compression fails
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

      setSuccess(true)
      setItems([{ url: '', quantity: 1, remark: '', file: null }]) // Reset items
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-lg text-center p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">{labelSuccessTitle}</h2>
          <p className="text-slate-600 mb-8 whitespace-pre-line">
            {labelSuccessDesc}
          </p>
          <Button onClick={() => router.push("/dashboard/orders")} variant="default" className="w-full cursor-pointer bg-primary text-white hover:bg-primary/90">{labelViewOrders}</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{t.navSubmitLink}</h1>
          <p className="text-slate-600">
            {labelContactSub}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{locale === 'en' ? 'Quotation Request Form' : locale === 'zh' ? '价格评估申请表' : 'แบบฟอร์มคำขอประเมินราคา'}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md mb-6">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{locale === 'en' ? 'Service Type' : locale === 'zh' ? '服务类型' : 'ประเภทบริการ'}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${serviceType === 'BUY_AND_IMPORT' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-primary/50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="serviceType" value="BUY_AND_IMPORT" checked={serviceType === 'BUY_AND_IMPORT'} onChange={() => setServiceType('BUY_AND_IMPORT')} className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-semibold text-slate-800">{locale === 'en' ? 'Order & Import' : locale === 'zh' ? '代购 + 进口' : 'ฝากสั่งซื้อ + นำเข้า'}</div>
                        <div className="text-xs text-slate-500 mt-1">{locale === 'en' ? 'Provide URL, we buy for you' : locale === 'zh' ? '提供链接，我们为您代购' : 'ใส่ลิงก์สินค้า เราจัดการสั่งให้ตั้งแต่ต้น'}</div>
                      </div>
                    </div>
                  </label>
                  <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-all ${serviceType === 'IMPORT_ONLY' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-primary/50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="serviceType" value="IMPORT_ONLY" checked={serviceType === 'IMPORT_ONLY'} onChange={() => setServiceType('IMPORT_ONLY')} className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-semibold text-slate-800">{locale === 'en' ? 'Import Only' : locale === 'zh' ? '仅进口 (客户自行下单)' : 'ลูกค้านำเข้าเอง (นำเข้าอย่างเดียว)'}</div>
                        <div className="text-xs text-slate-500 mt-1">{locale === 'en' ? 'You buy, provide tracking number' : locale === 'zh' ? '您自行下单，提供快递单号' : 'ลูกค้าสั่งเอง ใส่แค่เลขพัสดุจีน'}</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2">{labelContactInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.formName} *</label>
                    <Input 
                      key={`name-${profile?.full_name || "empty"}`}
                      required 
                      placeholder={t.formNamePlaceholder} 
                      name="customerName" 
                      defaultValue={profile?.full_name || ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.formPhone} *</label>
                    <Input 
                      key={`phone-${profile?.phone || "empty"}`}
                      required 
                      placeholder={t.formPhonePlaceholder} 
                      name="phone" 
                      defaultValue={profile?.phone || ""} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{labelLineId}</label>
                  <Input placeholder="Line ID / WeChat ID" name="lineId" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2 pt-4">
                  <h3 className="font-semibold">{locale === 'en' ? 'Shipping Method' : locale === 'zh' ? '运输方式' : 'รูปแบบการขนส่ง'} *</h3>
                </div>
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="shippingType" value="CAR" required className="w-4 h-4 text-primary" />
                    <span>{locale === 'en' ? 'By Truck (ทางรถ)' : locale === 'zh' ? '陆运 (ทางรถ)' : 'ทางรถ (Truck)'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="shippingType" value="BOAT" required className="w-4 h-4 text-primary" />
                    <span>{locale === 'en' ? 'By Sea (ทางเรือ)' : locale === 'zh' ? '海运 (ทางเรือ)' : 'ทางเรือ (Sea)'}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2 pt-4">
                  <h3 className="font-semibold">{labelProductInfo}</h3>
                </div>
                
                {items.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700 text-sm">{locale === 'en' ? `Item ${index + 1}` : locale === 'zh' ? `商品 ${index + 1}` : `รายการที่ ${index + 1}`}</span>
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer">
                          {locale === 'en' ? 'Remove' : locale === 'zh' ? '删除' : 'ลบรายการนี้'}
                        </button>
                      )}
                    </div>
                    {serviceType === 'BUY_AND_IMPORT' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{labelProductUrl}</label>
                        <Input 
                          required 
                          type="text" 
                          placeholder="https://item.taobao.com/... หรือใส่ข้อความได้" 
                          value={item.url}
                          onChange={(e) => handleItemChange(index, 'url', e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-700">{locale === 'en' ? 'China Tracking Number *' : locale === 'zh' ? '中国快递单号 *' : 'เลขพัสดุจีน (Tracking Number) *'}</label>
                        <Input 
                          required 
                          type="text" 
                          placeholder={locale === 'en' ? 'e.g. YT123456789' : 'เช่น YT123456789'}
                          value={item.china_tracking_number}
                          onChange={(e) => handleItemChange(index, 'china_tracking_number', e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                          {locale === 'en' ? 'Required so warehouse can identify your package.' : locale === 'zh' ? '必须填写以便仓库识别包裹。' : 'จำเป็นต้องใส่เพื่อให้โกดังจีนทราบว่าเป็นพัสดุของท่าน'}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{labelQuantity}</label>
                      <Input 
                        required 
                        type="number" 
                        min="1" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{labelRemark}</label>
                      <textarea 
                        value={item.remark}
                        onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={labelRemarkPlaceholder}
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-col space-y-2 pt-1 border-t mt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`wooden-crate-${index}`}
                          checked={item.wooden_crate || false}
                          onChange={(e) => handleItemChange(index, 'wooden_crate', e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-slate-300"
                        />
                        <label htmlFor={`wooden-crate-${index}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                          {locale === 'en' ? 'Require Wooden Crate (ตีลังไม้)' : locale === 'zh' ? '需要木箱包装 (ตีลังไม้)' : 'ต้องการบริการตีลังไม้ (ป้องกันสินค้าเสียหาย)'}
                        </label>
                      </div>
                      <div className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded ml-6">
                        <span className="font-semibold block mb-1">อัตราค่าบริการตีลังไม้ (ชำระพร้อมค่าขนส่งรอบ 2):</span>
                        <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                          <li>ต่ำกว่า 0.2 คิว: 200 บาท</li>
                          <li>0.2 - 0.5 คิว: 350 บาท</li>
                          <li>0.5 - 1 คิว: 550 บาท</li>
                          <li>1 - 2 คิว: 950 บาท</li>
                          <li>2 คิวขึ้นไป: 1,250 บาท</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-medium">{locale === 'en' ? 'Product Image (Optional)' : locale === 'zh' ? '商品图片 (选填)' : 'รูปภาพสินค้าเพิ่มเติม (ถ้ามี)'}</label>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleItemChange(index, 'file', file)
                        }}
                      />
                      {item.file && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {item.file.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  variant="outline" 
                  className="w-full border-dashed border-2 py-6 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  + {locale === 'en' ? 'Add Another Item' : locale === 'zh' ? '添加另一件商品' : 'เพิ่มรายการสินค้า'}
                </Button>
              </div>

              <Button type="submit" className="w-full h-12 text-lg cursor-pointer" variant="orange" disabled={isSubmitting}>
                {isSubmitting ? (locale === 'en' ? 'Submitting...' : locale === 'zh' ? '正在提交...' : 'กำลังส่งข้อมูล...') : (locale === 'en' ? 'Submit for Quotation' : locale === 'zh' ? '提交以评估价格' : 'ส่งลิงก์ให้ประเมินราคา')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
