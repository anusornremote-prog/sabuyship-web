"use client"

import React, { useState, useEffect } from 'react'
import { FileText, ShieldCheck, Scale, Clock, CreditCard, Box, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { hasLegalIdentity, publicBusinessConfig } from '@/lib/public-business-config'

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("section-1")

  const sections = [
    { id: "section-1", title: "1. บทนำและข้อตกลงทั่วไป", icon: <FileText className="w-4 h-4" /> },
    { id: "section-2", title: "2. นิยามศัพท์", icon: <Info className="w-4 h-4" /> },
    { id: "section-3", title: "3. ขอบเขตการให้บริการ", icon: <Box className="w-4 h-4" /> },
    { id: "section-4", title: "4. สินค้าต้องห้าม", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "section-5", title: "5. อัตราค่าขนส่งและการคำนวณ", icon: <Scale className="w-4 h-4" /> },
    { id: "section-6", title: "6. การคุ้มครองและเรียกร้อง", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "section-7", title: "7. ระยะเวลาและสินค้าตกค้าง", icon: <Clock className="w-4 h-4" /> },
    { id: "section-8", title: "8. การชำระเงินและคืนเงิน", icon: <CreditCard className="w-4 h-4" /> },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150
      
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">เงื่อนไขและข้อตกลงการให้บริการ</h1>
            <p className="text-lg text-slate-500 mb-6">Terms of Service (TOS) & Conditions</p>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 w-fit px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>ปรับปรุงข้อมูลล่าสุด: 14 กันยายน 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-1/4 shrink-0 lg:sticky lg:top-28 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-bold text-slate-900 mb-4 px-2">สารบัญเงื่อนไข (Contents)</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-left transition-colors ${
                      activeSection === section.id 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={activeSection === section.id ? 'text-blue-600' : 'text-slate-400'}>
                      {section.icon}
                    </span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Terms */}
          <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-sm border p-6 md:p-10 space-y-12">
            <div className={`rounded-xl border p-4 text-sm ${hasLegalIdentity ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
              <p className="font-bold">ผู้ให้บริการ: {publicBusinessConfig.brandName} (ผู้ประกอบการบุคคลธรรมดา)</p>
              <p>ชื่อผู้ประกอบการ: {publicBusinessConfig.legalName || 'ยังไม่ได้ระบุ'}</p>
              <p>ที่อยู่ติดต่อ: {publicBusinessConfig.address || 'ยังไม่ได้ระบุ'}</p>
              <p>{publicBusinessConfig.phone ? `โทร: ${publicBusinessConfig.phone} · ` : ''}อีเมล: {publicBusinessConfig.email} · LINE: @sabuyship</p>
              {publicBusinessConfig.commercialRegistrationNo && <p>เลขทะเบียนพาณิชย์: {publicBusinessConfig.commercialRegistrationNo}</p>}
              {!hasLegalIdentity && <p className="mt-2 font-bold">เว็บไซต์ยังไม่พร้อมเปิดรับคำสั่งซื้อจริงจนกว่าจะระบุตัวผู้ให้บริการครบถ้วน</p>}
            </div>
            
            <section id="section-1" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">1. บทนำและข้อตกลงทั่วไป</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>1.1 เงื่อนไขนี้กำหนดสิทธิ หน้าที่ และความรับผิดชอบระหว่างผู้ประกอบการบุคคลธรรมดาที่ใช้ชื่อทางการค้า <strong>Sabuy Ship Express</strong> ("ผู้ให้บริการ") และผู้ใช้บริการ ("ลูกค้า")</p>
                <p>1.2 ลูกค้าจะได้รับโอกาสตรวจสอบเงื่อนไข ใบเสนอราคา และค่าใช้จ่ายก่อนกดยืนยันคำสั่งซื้อ การส่งคำขอใบเสนอราคาเพียงอย่างเดียวยังไม่ก่อให้เกิดหน้าที่ชำระเงิน</p>
                <p>1.3 หากมีการแก้ไขเงื่อนไข ผู้ให้บริการจะแจ้งวันที่มีผลและเผยแพร่ฉบับใหม่ล่วงหน้าตามสมควร การแก้ไขไม่มีผลย้อนหลังต่อคำสั่งซื้อที่ยืนยันแล้ว เว้นแต่กฎหมายกำหนดหรือคู่สัญญาตกลงกัน</p>
              </div>
            </section>

            <section id="section-2" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">2. นิยามศัพท์</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>บริการฝากสั่งซื้อพร้อมนำเข้า (Buy & Import)</strong> หมายถึง บริการที่ลูกค้ามอบหมายให้ผู้ให้บริการประสานงานสั่งซื้อ ชำระเงินแก่ร้านค้าแทน และจัดการขนส่งมายังประเทศไทย</li>
                  <li><strong>บริการนำเข้าอย่างเดียว (Import Only)</strong> หมายถึง บริการที่ลูกค้าดำเนินการสั่งซื้อและชำระค่าสินค้ากับร้านค้าจีนด้วยตนเอง และใช้บริการเฉพาะการขนส่งจากโกดังจีนมายังโกดังไทยเท่านั้น</li>
                  <li><strong>โกดังจีน (China Warehouse)</strong> หมายถึงจุดรับสินค้าของผู้ให้บริการหรือคู่ค้าในประเทศจีนสำหรับรวบรวมสินค้าก่อนส่งออก</li>
                  <li><strong>โกดังไทย (Thai Warehouse)</strong> หมายถึงจุดรับหรือคลังของผู้ให้บริการหรือคู่ค้าในประเทศไทยสำหรับกระจายสินค้า</li>
                </ul>
              </div>
            </section>

            <section id="section-3" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">3. ขอบเขตการให้บริการและความรับผิดชอบ</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p><strong>3.1 สำหรับบริการฝากสั่งซื้อพร้อมนำเข้า (Buy & Import)</strong></p>
                <ul className="list-decimal pl-5 space-y-1 mb-4">
                  <li>ผู้ให้บริการเป็นผู้ประสานงานการสั่งซื้อและขนส่ง ไม่ใช่ผู้ผลิตสินค้า โดยจะแสดงข้อมูลร้านค้าและค่าใช้จ่ายที่ทราบในใบเสนอราคา</li>
                  <li>คุณภาพ สี ขนาด และการทำงานขึ้นอยู่กับข้อมูลและสินค้าจากร้านค้าจีน ผู้ให้บริการจะตรวจตามบริการที่ลูกค้าเลือกและแจ้งข้อจำกัดก่อนยืนยัน</li>
                  <li>หากสินค้าไม่ตรงคำสั่งซื้อ ผู้ให้บริการจะรวบรวมหลักฐานและประสานการคืนหรือชดเชยจากร้านค้า โดยไม่ตัดสิทธิของลูกค้าตามกฎหมายคุ้มครองผู้บริโภค</li>
                </ul>
                <p><strong>3.2 สำหรับบริการนำเข้าอย่างเดียว (Import Only)</strong></p>
                <ul className="list-decimal pl-5 space-y-1">
                  <li>ลูกค้าต้องเป็นผู้ดำเนินการสั่งซื้อ ชำระเงิน และเจรจากับร้านค้าจีนด้วยตนเองทั้งหมด</li>
                  <li>ขอบเขตบริการนำเข้าเริ่มเมื่อระบบยืนยันรับสินค้าเข้าจุดรับที่จีนแล้ว</li>
                  <li>เหตุที่เกิดก่อนการรับเข้าจุดรับที่จีนเป็นความรับผิดของร้านค้าหรือขนส่งต้นทางเป็นหลัก แต่ผู้ให้บริการจะให้ข้อมูลและช่วยประสานงานตามสมควร</li>
                </ul>
              </div>
            </section>

            <section id="section-4" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">4. สินค้าต้องห้ามและสินค้าควบคุม</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>4.1 ผู้ให้บริการไม่รับนำเข้าของต้องห้าม และรับของต้องกำกัดเฉพาะเมื่อมีใบอนุญาตหรือเอกสารครบถ้วนตามกฎหมาย:</p>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 my-4">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-4 text-sm font-medium">
                    <li>ยาเสพติด สารเสพติด และสิ่งผิดกฎหมายทุกชนิด</li>
                    <li>อาวุธปืน วัตถุระเบิด และสิ่งเทียมอาวุธปืน</li>
                    <li>สื่อลามกอนาจาร สินค้าละเมิดลิขสิทธิ์</li>
                    <li>สารเคมีอันตราย วัตถุไวไฟ และสารกัมมันตรังสี</li>
                    <li>สิ่งมีชีวิต ซากสัตว์ พืช และดิน</li>
                    <li>สินค้าที่ขัดต่อความสงบเรียบร้อยและศีลธรรมอันดี</li>
                  </ul>
                </div>
                <p>4.2 เมื่อพบสินค้าที่อาจผิดกฎหมาย ผู้ให้บริการอาจระงับการดำเนินการ แยกเก็บ แจ้งลูกค้า คู่ขนส่ง หรือหน่วยงานที่มีอำนาจ และดำเนินการตามคำสั่งหรือกฎหมาย ค่าใช้จ่ายหรือความเสียหายจะเรียกเก็บได้เฉพาะส่วนที่เกิดขึ้นจริงและลูกค้าต้องรับผิดตามกฎหมาย</p>
              </div>
            </section>

            <section id="section-5" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">5. อัตราค่าขนส่งและการคำนวณ</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>5.1 ผู้ให้บริการคำนวณค่าขนส่งจีน-ไทยจาก <strong>น้ำหนักจริง (กิโลกรัม)</strong> หรือ <strong>ปริมาตร (CBM)</strong> ตามเกณฑ์ที่เปิดเผยในใบเสนอราคา โดยใช้ยอดที่สูงกว่า</p>
                <p>5.2 สูตรการคิดปริมาตร (CBM) คือ: <code>กว้าง (ซม.) x ยาว (ซม.) x สูง (ซม.) / 1,000,000</code></p>
                <p>5.3 ค่าอากร ภาษี ใบอนุญาต ค่าตรวจปล่อย ค่าพื้นที่พิเศษ หรือค่าใช้จ่ายอื่นที่ไม่รวมในราคา จะต้องแจ้งให้ลูกค้าทราบก่อนเรียกเก็บเมื่อสามารถคำนวณได้</p>
                <p>5.4 การตีลังไม้ (Wooden Crate) สำหรับสินค้าเปราะบาง แตกหักง่าย หรือสินค้าอิเล็กทรอนิกส์ จะมีค่าใช้จ่ายเพิ่มเติมตามขนาดของลัง และอาจทำให้น้ำหนัก/ปริมาตรของสินค้าเพิ่มขึ้น ซึ่งจะถูกนำไปรวมในการคำนวณค่าขนส่งด้วย</p>
              </div>
            </section>

            <section id="section-6" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">6. การคุ้มครองสินค้าและการเรียกร้องความเสียหาย</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>6.1 ผู้ให้บริการรับผิดชอบความเสียหายที่เกิดจากการจงใจหรือประมาทเลินเล่อของผู้ให้บริการตามความเสียหายจริงและกฎหมายที่ใช้บังคับ โดยพิจารณาหลักฐาน มูลค่าที่สำแดง และความรับผิดของคู่ขนส่งประกอบกัน</p>
                <p>6.2 บริการตีลังไม้เป็นการลดความเสี่ยง ไม่ใช่การรับประกันว่าสินค้าจะไม่เสียหาย หากมีแผนคุ้มครองเพิ่มเติม ผู้ให้บริการจะแจ้งผู้รับผิดชอบ ขอบเขต ข้อยกเว้น ค่าใช้จ่าย และวิธีเรียกร้องในใบเสนอราคาก่อนลูกค้าเลือกซื้อ และจะไม่เรียกว่า “ประกันภัย” เว้นแต่จัดให้โดยผู้รับประกันที่มีสิทธิตามกฎหมาย</p>
                <p>6.3 ลูกค้าควรแจ้งปัญหาภายใน 7 วันหลังรับสินค้า พร้อมภาพบรรจุภัณฑ์ สินค้า ฉลาก และวิดีโอเปิดกล่องถ้ามี การไม่มีวิดีโอเพียงอย่างเดียวไม่ทำให้เสียสิทธิอัตโนมัติ ผู้ให้บริการจะพิจารณาหลักฐานทั้งหมดอย่างเป็นธรรม</p>
                <p>6.4 ไม่มีข้อความใดในเงื่อนไขนี้ตัดหรือจำกัดสิทธิของผู้บริโภคที่กฎหมายบังคับให้ได้รับ</p>
              </div>
            </section>

            <section id="section-7" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">7. ระยะเวลาการขนส่ง และสินค้าตกค้าง</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>7.1 ระยะเวลาการขนส่งโดยประมาณ (นับจากวันที่สินค้าออกจากโกดังจีน):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>ทางรถ (EK):</strong> ประมาณ 5-7 วัน</li>
                  <li><strong>ทางเรือ (SEA):</strong> ประมาณ 15-20 วัน</li>
                </ul>
                <p>7.2 ระยะเวลาดังกล่าวเป็นประมาณการและอาจเปลี่ยนจากศุลกากร สภาพอากาศ การตรวจสินค้า การจราจร หรือเหตุที่ควบคุมไม่ได้ ผู้ให้บริการจะแจ้งความล่าช้าที่มีสาระสำคัญเมื่อทราบ</p>
                <p>7.3 เมื่อสินค้าถึงโกดังไทย ลูกค้าควรชำระยอดที่แจ้งและนัดรับหรือจัดส่งภายใน 15 วัน ค่าจัดเก็บหลังครบกำหนดจะเรียกเก็บได้เมื่อได้แจ้งอัตรา 50–200 บาทต่อวันตามขนาดสินค้าไว้อย่างชัดเจนก่อนยืนยันคำสั่งซื้อ</p>
                <p>7.4 สำหรับสินค้าตกค้าง ผู้ให้บริการจะติดต่อและส่งคำบอกกล่าวเป็นลายลักษณ์อักษร พร้อมให้เวลาไม่น้อยกว่า 30 วันเพื่อชำระและรับสินค้า ก่อนดำเนินการอื่นตามกฎหมาย โดยไม่ริบหรือขายสินค้าโดยอัตโนมัติ</p>
              </div>
            </section>

            <section id="section-8" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">8. การชำระเงินและการคืนเงิน</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>8.1 <strong>การชำระเงินตามรอบ:</strong> ระบบมีการเรียกเก็บเงิน 3 รอบ คือ 1. ค่าสินค้า 2. ค่าขนส่งจีน-ไทย และ 3. ค่าขนส่งในไทย ลูกค้าจะต้องชำระเงินให้ครบถ้วนในแต่ละรอบก่อน ระบบจึงจะดำเนินการในขั้นตอนต่อไปได้ <em>(ยกเว้นบริการนำเข้าอย่างเดียว ที่จะไม่มีการเรียกเก็บค่าสินค้ารอบที่ 1)</em></p>
                <p>8.2 <strong>การคืนเงิน:</strong> หากร้านค้าจีนยกเลิก ไม่มีสินค้า หรือส่งไม่ครบ ผู้ให้บริการจะแสดงยอดที่ขอคืนและคืนให้ลูกค้าภายใน 7 วันทำการนับจากวันที่ได้รับเงินคืนและข้อมูลบัญชีที่ถูกต้อง โดยลูกค้าเลือกได้ว่าจะรับโอนเข้าบัญชีหรือใช้เป็นเครดิตหักยอดครั้งถัดไป</p>
                <p>8.3 หากร้านค้าปฏิเสธหรือยังไม่คืนเงิน ผู้ให้บริการจะแจ้งสถานะและหลักฐานที่มี พร้อมช่วยใช้กระบวนการร้องเรียนของแพลตฟอร์ม ทั้งนี้ไม่กระทบความรับผิดของผู้ให้บริการที่เกิดจากการกระทำของตนเองหรือสิทธิของลูกค้าตามกฎหมาย</p>
                <p>8.4 ลูกค้าต้องตรวจสอบชื่อผู้รับเงินให้ตรงกับชื่อผู้ประกอบการที่เปิดเผยบนเว็บไซต์ ผู้ให้บริการจะออกใบสรุปรายการและหลักฐานรับเงินตามสถานะจริง แต่จะไม่ออกใบกำกับภาษีจนกว่าจะเป็นผู้ประกอบการจดทะเบียน VAT และมีสิทธิออกตามกฎหมาย</p>
              </div>
            </section>
            
            <div className="pt-10 mt-10 border-t-2 border-dashed border-slate-200 text-center">
              <p className="text-sm font-semibold text-slate-500 max-w-lg mx-auto">
                ลูกค้าต้องกดยืนยันว่าได้อ่านเงื่อนไขและตรวจสอบใบเสนอราคาก่อนยืนยันคำสั่งซื้อ
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
