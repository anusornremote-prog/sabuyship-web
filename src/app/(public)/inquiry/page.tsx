"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"

export default function InquiryForm() {
  const { t, locale } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string } | null>(null)
  const [items, setItems] = useState([{ url: '', quantity: 1, remark: '' }])

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
        }
      } catch (err) {
        console.error("Error fetching profile for inquiry:", err)
      }
    }
    fetchProfile()
  }, [])

  const labelContactInfo = locale === 'en' ? 'Contact Information' : locale === 'zh' ? '联系信息' : 'ข้อมูลผู้ติดต่อ'
  const labelContactSub = locale === 'en' ? 'Provide contact details so we can send the quotation' : locale === 'zh' ? '请提供联系方式以便我们发送报价单' : 'กรอกข้อมูลสินค้าและช่องทางติดต่อ เพื่อให้ทีมงานประเมินราคาและค่าขนส่ง'
  const labelProductInfo = locale === 'en' ? 'Product Information' : locale === 'zh' ? '商品信息' : 'ข้อมูลสินค้า'
  const labelProductUrl = locale === 'en' ? 'Product Link (URL) *' : locale === 'zh' ? '商品链接 (URL) *' : 'ลิงก์สินค้า (URL) *'
  const labelQuantity = locale === 'en' ? 'Quantity *' : locale === 'zh' ? '数量 *' : 'จำนวนที่ต้องการ *'
  const labelRemark = locale === 'en' ? 'Remarks / Specific details (Color, Size)' : locale === 'zh' ? '备注 / 规格详情 (颜色, 尺码)' : 'หมายเหตุ / รายละเอียดเพิ่มเติม (สี, ไซส์)'
  const labelRemarkPlaceholder = locale === 'en' ? 'e.g. Black color, size M, 2 pieces' : locale === 'zh' ? '例如：黑色 M码 2件' : 'เช่น เอาสีดำ ไซส์ M อย่างละ 2 ตัว'
  const labelLineId = locale === 'en' ? 'LINE ID / WeChat ID (Recommended)' : locale === 'zh' ? 'LINE ID / 微信 (推荐)' : 'LINE ID / WeChat ID (แนะนำ)'
  const labelSuccessTitle = locale === 'en' ? 'Submitted Successfully!' : locale === 'zh' ? '提交成功！' : 'ส่งคำขอสำเร็จ!'
  const labelSuccessDesc = locale === 'en' ? 'We have received your product link for quotation.\nOur team will review it and reply within 24 hours.' : locale === 'zh' ? '我们已收到您的报价申请。\n团队将审核并于24小时内与您联系。' : 'ทีมงานได้รับคำขอให้ประเมินราคาเรียบร้อยแล้ว\nเราจะทำการตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง'
  const labelNewInquiry = locale === 'en' ? 'Submit Another Request' : locale === 'zh' ? '提交新申请' : 'ส่งคำขอใหม่'

  const handleAddItem = () => {
    setItems([...items, { url: '', quantity: 1, remark: '' }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate items
    if (items.some(item => !item.url.trim())) {
      setError(locale === 'en' ? 'Please fill in all product URLs.' : locale === 'zh' ? '请填写所有商品链接。' : 'กรุณากรอกลิงก์สินค้าให้ครบทุกรายการ')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      customer_name: formData.get("customerName"),
      phone: formData.get("phone"),
      line_id: formData.get("lineId"),
      items: items.map(item => ({
        url: item.url,
        quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity,
        remark: item.remark
      }))
    }

    try {
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
      setItems([{ url: '', quantity: 1, remark: '' }]) // Reset items
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
          <Button onClick={() => setSuccess(false)} variant="outline" className="w-full cursor-pointer">{labelNewInquiry}</Button>
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{labelProductUrl}</label>
                      <Input 
                        required 
                        type="url" 
                        placeholder="https://item.taobao.com/..." 
                        value={item.url}
                        onChange={(e) => handleItemChange(index, 'url', e.target.value)}
                      />
                    </div>
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
