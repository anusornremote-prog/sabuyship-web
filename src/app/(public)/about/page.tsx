import Link from "next/link"
import { ArrowLeft, Truck, ShieldCheck, Clock, HeartHandshake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "เกี่ยวกับเรา (About Us) | Sabuy Ship",
  description: "ทำความรู้จักกับ Sabuy Ship บริการขนส่งที่ทำให้ชีวิตคุณง่ายขึ้น",
}

export default function AboutUs() {
  const features = [
    {
      icon: <Truck className="w-8 h-8 text-blue-500" />,
      title: "จัดส่งรวดเร็ว",
      description: "บริการขนส่งที่ตรงต่อเวลา และมีประสิทธิภาพ เพื่อให้พัสดุถึงมือผู้รับอย่างปลอดภัย"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
      title: "ปลอดภัย มั่นใจได้",
      description: "ระบบติดตามสถานะพัสดุแบบเรียลไทม์ พร้อมการรับประกันสินค้าตลอดการเดินทาง"
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "บริการตลอด 24 ชม.",
      description: "ทำรายการได้ตลอดเวลาผ่านระบบจัดการหน้าเว็บที่ใช้งานง่ายและสะดวกที่สุด"
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-red-500" />,
      title: "บริการด้วยใจ",
      description: "ทีมงานพร้อมให้คำปรึกษาและช่วยเหลือตลอดการใช้งาน เพื่อความพึงพอใจสูงสุด"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับสู่หน้าหลัก
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border mb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">เกี่ยวกับ Sabuy Ship</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              เราคือแพลตฟอร์มผู้ให้บริการด้านโลจิสติกส์และการจัดส่งพัสดุที่ครบวงจร 
              มุ่งเน้นการให้บริการที่ <span className="font-semibold text-primary">"สะดวก รวดเร็ว และปลอดภัย"</span> เพื่อตอบโจทย์ทุกธุรกิจออนไลน์และผู้ใช้งานทั่วไป
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">วิสัยทัศน์ของเรา (Vision)</h2>
              <p className="text-slate-600 leading-relaxed">
                ก้าวขึ้นเป็นผู้นำด้านเทคโนโลยีการขนส่งระดับประเทศ ที่เชื่อมโยงผู้คนและธุรกิจเข้าด้วยกันผ่านระบบที่ทันสมัย ใช้งานง่าย และมีประสิทธิภาพสูงสุด
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">พันธกิจ (Mission)</h2>
              <p className="text-slate-600 leading-relaxed">
                เรามุ่งมั่นพัฒนาระบบหลังบ้านที่แข็งแกร่ง เพื่อลดต้นทุนและเวลาในการจัดการพัสดุ พร้อมสร้างประสบการณ์ที่ดีที่สุดให้กับทั้งผู้ส่งและผู้รับ
              </p>
            </div>
          </div>

          <div className="border-t pt-12">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">จุดเด่นของเรา</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <Card key={idx} className="border-none shadow-md bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <CardContent className="p-6 flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
