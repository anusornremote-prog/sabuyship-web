import React from 'react'
import { Metadata } from 'next'
import { ShieldCheck, UserCheck, Lock, FileText, Share2, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว - Sabuy Ship Express',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
        <p className="text-slate-500">ปรับปรุงข้อมูลล่าสุด: มกราคม 2026</p>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">1. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>เมื่อท่านสมัครสมาชิกหรือใช้บริการ Sabuy Ship Express เราจะทำการเก็บรวบรวมข้อมูลต่อไปนี้:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>ข้อมูลประจำตัว: ชื่อ-นามสกุล, เบอร์โทรศัพท์, อีเมล</li>
              <li>ข้อมูลสำหรับการจัดส่ง: ที่อยู่สำหรับจัดส่งสินค้า, รหัสไปรษณีย์</li>
              <li>ข้อมูลการทำธุรกรรม: ประวัติการสั่งซื้อ, สลิปการโอนเงิน, ข้อมูลบัญชีธนาคาร (สำหรับการคืนเงิน/ถอนเงิน)</li>
              <li>ข้อมูลทางเทคนิค: หมายเลข IP, ชนิดของเบราว์เซอร์, และข้อมูลการใช้งานเว็บไซต์ผ่านคุกกี้ (Cookies)</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">2. วัตถุประสงค์ในการเก็บข้อมูล</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>เรานำข้อมูลส่วนบุคคลของท่านไปใช้เพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>เพื่อใช้ในการสมัครสมาชิกและยืนยันตัวตน</li>
              <li>เพื่อดำเนินการสั่งซื้อ ประสานงานร้านค้าจีน และจัดส่งสินค้าถึงมือท่าน</li>
              <li>เพื่อแจ้งเตือนสถานะการขนส่ง (Tracking) และติดต่อสื่อสารกรณีมีปัญหาขัดข้อง</li>
              <li>เพื่อปรับปรุงคุณภาพการให้บริการและพัฒนาเว็บไซต์ให้ดียิ่งขึ้น</li>
              <li>เพื่อปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Share2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">3. การเปิดเผยข้อมูลแก่บุคคลที่สาม</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>เราไม่มีนโยบายขายข้อมูลส่วนบุคคลของท่านให้แก่บุคคลที่สามโดยเด็ดขาด อย่างไรก็ตาม เราอาจจำเป็นต้องแชร์ข้อมูลบางส่วนให้แก่:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>**บริษัทขนส่งเอกชน (ในไทย):** เช่น Kerry, Flash, J&T เพื่อใช้ในการจัดส่งสินค้าถึงบ้านท่าน (แชร์เฉพาะชื่อ ที่อยู่ เบอร์โทร)</li>
              <li>**พันธมิตรและร้านค้าจีน:** เฉพาะข้อมูลที่จำเป็นต่อการสั่งซื้อสินค้า</li>
              <li>**หน่วยงานรัฐหรือเจ้าหน้าที่ตามกฎหมาย:** เมื่อมีการร้องขอตามหมายศาลหรือกระบวนการทางกฎหมาย</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">4. ความปลอดภัยของข้อมูล</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>เราให้ความสำคัญกับความปลอดภัยของข้อมูลท่าน โดยใช้ระบบฐานข้อมูลที่มีมาตรฐานความปลอดภัยระดับสูง (Secure Server) และมีการเข้ารหัสข้อมูล (Encryption) เพื่อป้องกันการเข้าถึงจากผู้ที่ไม่ได้รับอนุญาต</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">5. สิทธิของเจ้าของข้อมูล (PDPA)</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ท่านมีสิทธิดังต่อไปนี้:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>สิทธิในการขอเข้าถึงและขอรับสำเนาข้อมูลของตนเอง</li>
              <li>สิทธิในการขอแก้ไขข้อมูลให้ถูกต้องและเป็นปัจจุบัน</li>
              <li>สิทธิในการขอให้ลบ หรือทำลายข้อมูลส่วนบุคคล (หากไม่มีความจำเป็นต้องใช้)</li>
              <li>สิทธิในการขอระงับการใช้ หรือคัดค้านการประมวลผลข้อมูล</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">6. การติดต่อเรา</h2>
          </div>
          <div className="pl-14 text-slate-600 space-y-2">
            <p>หากท่านมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการใช้สิทธิตามกฎหมาย โปรดติดต่อเราได้ที่:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>**อีเมล:** sabuyship.express@gmail.com</li>
              <li>**LINE OA:** @sabuyship</li>
            </ul>
          </div>
        </section>

        <div className="pt-6 mt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            บริษัทขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงนโยบายความเป็นส่วนตัวนี้ตามความเหมาะสม โดยจะมีการแจ้งให้ทราบผ่านทางเว็บไซต์ล่วงหน้า
          </p>
        </div>
      </div>
    </div>
  )
}
