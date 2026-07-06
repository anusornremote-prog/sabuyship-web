import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว (Privacy Policy) | Sabuy Ship",
  description: "นโยบายความเป็นส่วนตัวของการใช้งานเว็บไซต์และบริการ Sabuy Ship",
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับสู่หน้าหลัก
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-8">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <p>
            <strong>Sabuy Ship</strong> ("เรา", "พวกเรา" หรือ "เว็บไซต์") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีการที่เรารวบรวม ใช้ เปิดเผย และปกป้องข้อมูลส่วนบุคคลของคุณเมื่อคุณใช้บริการของเรา
          </p>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">1. ข้อมูลที่เรารวบรวม</h2>
          <p>เรารวบรวมข้อมูลส่วนบุคคลที่คุณให้ไว้กับเราโดยตรง ได้แก่:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>ข้อมูลบัญชีผู้ใช้:</strong> ชื่อ-นามสกุล, ที่อยู่อีเมล, รหัสผ่าน, เบอร์โทรศัพท์ และ LINE ID</li>
            <li><strong>ข้อมูลการจัดส่ง:</strong> ชื่อผู้รับ, ที่อยู่สำหรับจัดส่งสินค้า, และเบอร์โทรศัพท์ผู้รับ</li>
            <li><strong>ข้อมูลจากบัญชี Google:</strong> หากคุณเลือกล็อกอินด้วย Google เราจะรวบรวมชื่อ อีเมล และรูปโปรไฟล์พื้นฐานของคุณเพื่อใช้ในการสร้างบัญชี</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">2. วิธีการใช้ข้อมูลของคุณ</h2>
          <p>เรานำข้อมูลส่วนบุคคลของคุณไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>เพื่อให้บริการขนส่งและจัดส่งพัสดุตามที่คุณร้องขอ</li>
            <li>เพื่อจัดการบัญชีผู้ใช้และตรวจสอบตัวตนในการเข้าสู่ระบบ</li>
            <li>เพื่อติดต่อสื่อสารเกี่ยวกับการเปลี่ยนแปลงสถานะพัสดุหรือการแจ้งเตือนสำคัญ</li>
            <li>เพื่อปรับปรุงและพัฒนาบริการของ Sabuy Ship ให้ดียิ่งขึ้น</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">3. การเปิดเผยข้อมูล</h2>
          <p>เราไม่มีนโยบายขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สาม อย่างไรก็ตาม เราอาจเปิดเผยข้อมูลของคุณในกรณีที่จำเป็นดังนี้:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>ผู้ให้บริการขนส่ง (บริษัทขนส่ง):</strong> เพื่อให้การจัดส่งพัสดุของคุณสำเร็จลุล่วง</li>
            <li><strong>ตามข้อกำหนดของกฎหมาย:</strong> หากมีความจำเป็นตามกฎหมายหรือคำสั่งศาล</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">4. การรักษาความปลอดภัยของข้อมูล</h2>
          <p>
            เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมและเป็นมาตรฐานสากล เพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึง การใช้งาน หรือการเปิดเผยที่ไม่ได้รับอนุญาต อย่างไรก็ตาม ไม่มีการส่งผ่านข้อมูลทางอินเทอร์เน็ตใดที่ปลอดภัย 100%
          </p>

          <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">5. สิทธิของคุณ</h2>
          <p>คุณมีสิทธิในการเข้าถึง แก้ไข หรือขอลบข้อมูลส่วนบุคคลของคุณที่อยู่ในระบบของเรา โดยคุณสามารถทำได้ผ่านหน้า "ข้อมูลส่วนตัว" ในระบบ หรือติดต่อทีมงานของเรา</p>

          <div className="text-sm text-slate-500 pt-8 mt-8 border-t">
            อัปเดตล่าสุด: มิถุนายน 2026
          </div>
        </div>
      </div>
    </div>
  )
}
