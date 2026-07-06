"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"
import { Facebook } from "@/components/ui/icons"
import { useTranslation } from "@/components/providers/language-provider"

export default function Contact() {
  const { t } = useTranslation()

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
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">{t.formName}</label>
                  <Input id="name" placeholder={t.formNamePlaceholder} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">{t.formEmail}</label>
                  <Input id="email" type="email" placeholder={t.formEmailPlaceholder} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">{t.formPhone}</label>
                  <Input id="phone" placeholder={t.formPhonePlaceholder} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">{t.formMessage}</label>
                  <textarea 
                    id="message" 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t.formMessagePlaceholder}
                    required
                  ></textarea>
                </div>
                <Button type="submit" className="w-full h-12 text-lg cursor-pointer">{t.formSubmit}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
