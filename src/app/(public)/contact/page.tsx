"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"
import { Facebook } from "@/components/ui/icons"
import { useTranslation } from "@/components/providers/language-provider"
import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function Contact() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess(true)
      setFormData({ name: "", email: "", phone: "", message: "" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t.contactTitle}</h1>
          <p className="text-lg text-slate-600">
            {t.contactSub}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold mb-6">{t.contactInfoTitle}</h2>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t.lineResponse}</h3>
                <p className="text-slate-600 text-lg font-bold text-green-600 mb-2">@sabuyship</p>
                <img src="/QR-Line.jpg" alt="LINE QR Code" className="w-40 h-40 mb-4 rounded-md shadow-sm border" />
                <a href="https://lin.ee/UC0F9zl" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#06C755] hover:bg-[#05b34c] text-white w-full max-w-xs mb-2 shadow-sm font-semibold">
                    เพิ่มเพื่อน (Add Friend)
                  </Button>
                </a>
                <p className="text-sm text-slate-500">{t.lineHours}</p>
              </div>
            </div>



            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-primary">
                <Facebook className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Facebook Fanpage</h3>
                <p className="text-slate-600">Sabuy Ship Thailand - นำเข้าสินค้าจากจีน</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Email</h3>
                <p className="text-slate-600">sabuyship.express@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t.addressTitle}</h3>
                <p className="text-slate-600">{t.addressDesc}</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">{t.formTitle}</h2>
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <p>ส่งข้อความเรียบร้อยแล้ว ทีมงานจะรีบติดต่อกลับโดยเร็วที่สุดครับ</p>
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p>{error}</p>
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">{t.formName}</label>
                  <Input 
                    id="name" 
                    placeholder={t.formNamePlaceholder} 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">{t.formEmail}</label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t.formEmailPlaceholder} 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">{t.formPhone}</label>
                  <Input 
                    id="phone" 
                    placeholder={t.formPhonePlaceholder} 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">{t.formMessage}</label>
                  <textarea 
                    id="message" 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t.formMessagePlaceholder}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    disabled={loading}
                  ></textarea>
                </div>
                <Button type="submit" className="w-full h-12 text-lg cursor-pointer" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      กำลังส่งข้อความ...
                    </>
                  ) : (
                    t.formSubmit
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
