"use client"

import React, { useState, useEffect } from 'react'
import { FileText, ShieldCheck, Scale, Clock, CreditCard, Box, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("section-1")

  const sections = [
    { id: "section-1", title: "1. บทนำและข้อตกลงทั่วไป", icon: <FileText className="w-4 h-4" /> },
    { id: "section-2", title: "2. นิยามศัพท์", icon: <Info className="w-4 h-4" /> },
    { id: "section-3", title: "3. ขอบเขตการให้บริการ", icon: <Box className="w-4 h-4" /> },
    { id: "section-4", title: "4. สินค้าต้องห้าม", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "section-5", title: "5. อัตราค่าขนส่งและการคำนวณ", icon: <Scale className="w-4 h-4" /> },
    { id: "section-6", title: "6. การรับประกันและชดเชย", icon: <ShieldCheck className="w-4 h-4" /> },
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
              <span>ปรับปรุงข้อมูลล่าสุด: 16 กรกฎาคม 2026 (มีผลบังคับใช้ทันที)</span>
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
            
            <section id="section-1" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">1. บทนำและข้อตกลงทั่วไป</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>1.1 ข้อตกลงและเงื่อนไขการให้บริการฉบับนี้ ("เงื่อนไข") จัดทำขึ้นเพื่อกำหนดสิทธิ หน้าที่ และความรับผิดชอบระหว่าง **Sabuy Ship Express** ("บริษัท") และผู้ใช้บริการ ("ลูกค้า") ในการใช้บริการระบบนำเข้าสินค้า สั่งซื้อสินค้า และโลจิสติกส์ระหว่างประเทศ</p>
                <p>1.2 การที่ลูกค้าสมัครสมาชิกและใช้บริการของบริษัท ถือว่าลูกค้าได้อ่าน ทำความเข้าใจ และยอมรับข้อตกลงและเงื่อนไขนี้อย่างครบถ้วนและสมบูรณ์แล้ว หากลูกค้าไม่เห็นด้วยกับเงื่อนไขข้อใดข้อหนึ่ง กรุณางดใช้บริการ</p>
                <p>1.3 บริษัทขอสงวนสิทธิ์ในการแก้ไข ปรับปรุง หรือเปลี่ยนแปลงเงื่อนไขการให้บริการนี้ได้ตลอดเวลาโดยไม่ต้องแจ้งให้ทราบล่วงหน้า การเปลี่ยนแปลงจะมีผลทันทีเมื่อมีการประกาศบนเว็บไซต์</p>
              </div>
            </section>

            <section id="section-2" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">2. นิยามศัพท์</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>บริการฝากสั่งซื้อพร้อมนำเข้า (Buy & Import)</strong> หมายถึง บริการที่ลูกค้ามอบหมายให้บริษัทดำเนินการสั่งซื้อสินค้าจากร้านค้าในประเทศจีน ชำระเงินแทน และนำเข้าสินค้ามายังประเทศไทย</li>
                  <li><strong>บริการนำเข้าอย่างเดียว (Import Only)</strong> หมายถึง บริการที่ลูกค้าดำเนินการสั่งซื้อและชำระค่าสินค้ากับร้านค้าจีนด้วยตนเอง และใช้บริการเฉพาะการขนส่งจากโกดังจีนมายังโกดังไทยเท่านั้น</li>
                  <li><strong>โกดังจีน (China Warehouse)</strong> หมายถึง จุดรับสินค้าของบริษัทที่ตั้งอยู่ในประเทศจีน สำหรับรวบรวมสินค้าก่อนส่งออก</li>
                  <li><strong>โกดังไทย (Thai Warehouse)</strong> หมายถึง คลังสินค้าของบริษัทในประเทศไทย สำหรับกระจายสินค้าให้ลูกค้า</li>
                </ul>
              </div>
            </section>

            <section id="section-3" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">3. ขอบเขตการให้บริการและความรับผิดชอบ</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p><strong>3.1 สำหรับบริการฝากสั่งซื้อพร้อมนำเข้า (Buy & Import)</strong></p>
                <ul className="list-decimal pl-5 space-y-1 mb-4">
                  <li>บริษัททำหน้าที่เป็นเพียง "ผู้ประสานงาน" ในการสั่งซื้อและการขนส่งเท่านั้น ไม่ใช่ผู้ผลิตหรือผู้จำหน่ายสินค้าโดยตรง</li>
                  <li>บริษัทไม่สามารถรับประกันคุณภาพของสินค้า ความถูกต้องของสี ขนาด หรือการทำงานของสินค้าที่มาจากร้านค้าจีนได้</li>
                  <li>หากสินค้าที่ได้รับไม่ตรงตามที่สั่งซื้อ บริษัทจะช่วยประสานงานเรียกร้องกับร้านค้าจีนให้ตามขอบเขตความสามารถ แต่ไม่รับผิดชอบในการคืนเงินหากร้านค้าจีนปฏิเสธความรับผิดชอบ</li>
                </ul>
                <p><strong>3.2 สำหรับบริการนำเข้าอย่างเดียว (Import Only)</strong></p>
                <ul className="list-decimal pl-5 space-y-1">
                  <li>ลูกค้าต้องเป็นผู้ดำเนินการสั่งซื้อ ชำระเงิน และเจรจากับร้านค้าจีนด้วยตนเองทั้งหมด</li>
                  <li>บริษัทจะเริ่มรับผิดชอบต่อตัวสินค้า <strong>ก็ต่อเมื่อสินค้าได้ถูกจัดส่งถึงโกดังจีนและพนักงานของบริษัทได้เซ็นรับเข้าสู่ระบบเรียบร้อยแล้วเท่านั้น</strong></li>
                  <li>หากสินค้าสูญหาย เสียหาย หรือส่งผิดพลาดในระหว่างการขนส่งภายในประเทศจีน (ก่อนถึงโกดัง) บริษัทจะไม่รับผิดชอบในทุกกรณี ลูกค้าต้องติดตามกับร้านค้าหรือขนส่งจีนด้วยตนเอง</li>
                </ul>
              </div>
            </section>

            <section id="section-4" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">4. สินค้าต้องห้ามและสินค้าควบคุม</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>4.1 บริษัทขอสงวนสิทธิ์ <strong>งดให้บริการนำเข้า</strong> สินค้าดังต่อไปนี้อย่างเด็ดขาด:</p>
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
                <p>4.2 หากลูกค้าลักลอบส่งสินค้าต้องห้ามเข้าสู่ระบบ และบริษัทตรวจพบ บริษัทจะทำการ <strong>ยึดหรือทำลายสินค้าทันทีโดยไม่มีการชดเชยใดๆ</strong> และลูกค้าจะต้องรับผิดชอบต่อความเสียหายทางกฎหมายหรือค่าปรับที่เกิดขึ้นกับบริษัททั้งหมด</p>
              </div>
            </section>

            <section id="section-5" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">5. อัตราค่าขนส่งและการคำนวณ</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>5.1 บริษัทคำนวณค่าขนส่งจีน-ไทย ตาม <strong>น้ำหนักจริง (กิโลกรัม)</strong> หรือ <strong>น้ำหนักปริมาตร (CBM)</strong> โดยระบบจะคำนวณเปรียบเทียบและเลือกอัตราที่ให้ผลลัพธ์มูลค่าค่าขนส่งสูงกว่า</p>
                <p>5.2 สูตรการคิดปริมาตร (CBM) คือ: <code>กว้าง (ซม.) x ยาว (ซม.) x สูง (ซม.) / 1,000,000</code></p>
                <p>5.3 สินค้าที่มีน้ำหนักมากแต่ปริมาตรน้อย (เช่น อะไหล่เหล็ก) หากเกิน 100 กิโลกรัม บริษัทจะประเมินคิดราคาแบบกิโลกรัม</p>
                <p>5.4 การตีลังไม้ (Wooden Crate) สำหรับสินค้าเปราะบาง แตกหักง่าย หรือสินค้าอิเล็กทรอนิกส์ จะมีค่าใช้จ่ายเพิ่มเติมตามขนาดของลัง และอาจทำให้น้ำหนัก/ปริมาตรของสินค้าเพิ่มขึ้น ซึ่งจะถูกนำไปรวมในการคำนวณค่าขนส่งด้วย</p>
              </div>
            </section>

            <section id="section-6" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">6. การรับประกันและชดเชยค่าเสียหาย</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>6.1 <strong>กรณีไม่ได้ซื้อประกันสินค้า:</strong> หากสินค้าสูญหายอันเกิดจากความผิดพลาดของทางบริษัท (ระหว่างทางจากโกดังจีนถึงโกดังไทย) บริษัทจะชดเชยตามมูลค่าจริงของสินค้า แต่ต้อง <strong>ไม่เกิน 3 เท่าของค่าขนส่งของสินค้ารายการนั้น</strong></p>
                <p>6.2 <strong>กรณีซื้อประกันสินค้า:</strong> ลูกค้าสามารถซื้อประกันภัยสินค้าสูญหายได้ในอัตรา 3-5% ของมูลค่าสินค้า หากเกิดการสูญหาย บริษัทจะชดเชยให้ <strong>เต็ม 100% ของมูลค่าสินค้าที่ได้สำแดงไว้</strong></p>
                <p>6.3 <strong>ข้อยกเว้นความรับผิดชอบ:</strong> บริษัท <strong>ไม่รับประกัน</strong> ความเสียหายจากการแตกหัก บิดเบี้ยว บุบ หรือเสื่อมสภาพจากการขนส่ง สำหรับสินค้าทุกประเภท (โดยเฉพาะ แก้ว เซรามิค พลาสติก หน้าจอ) ยกเว้นในกรณีที่ลูกค้าได้สั่ง "ตีลังไม้" และมีความเสียหายรุนแรง ซึ่งบริษัทจะพิจารณาชดเชยเป็นกรณีๆ ไปตามดุลพินิจ</p>
                <p>6.4 <strong>การเคลม:</strong> ลูกค้าต้องแจ้งเคลมสินค้าภายใน <strong>7 วัน</strong> นับจากวันที่ได้รับสินค้า โดยต้องแนบรูปถ่ายสภาพกล่อง/กระสอบภายนอก และ <strong>วิดีโอแบบต่อเนื่อง (ไม่ตัดต่อ) ขณะเปิดพัสดุ</strong> หากไม่มีวิดีโอยืนยัน บริษัทขอสงวนสิทธิ์ปฏิเสธการเคลมทุกกรณี</p>
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
                <p>7.2 ระยะเวลาข้างต้นเป็นเพียงการประมาณการ อาจมีความล่าช้าเกิดขึ้นได้จากเหตุสุดวิสัย เช่น ภัยพิบัติทางธรรมชาติ นโยบายด่านศุลกากร การตรวจค้นเข้มงวด หรือปัญหาจราจรติดขัดบริเวณด่านพรมแดน ซึ่งอยู่นอกเหนือการควบคุมของบริษัท</p>
                <p>7.3 <strong>ค่าปรับสินค้าตกค้าง:</strong> เมื่อสินค้าถึงโกดังไทย ลูกค้าจะต้องชำระค่าขนส่งและรับสินค้า (หรือให้จัดส่ง) ภายใน <strong>15 วัน</strong> หากเกินกำหนด บริษัทจะคิดค่าบริการจัดเก็บรักษาสินค้าในอัตรา 50 - 200 บาท/วัน (ขึ้นอยู่กับขนาดสินค้า)</p>
                <p>7.4 หากสินค้าตกค้างเกิน <strong>60 วัน</strong> บริษัทขอสงวนสิทธิ์ริบสินค้า และนำไปขายทอดตลาดเพื่อชดเชยค่าขนส่งและค่าโกดัง โดยลูกค้าไม่สามารถเรียกร้องค่าเสียหายใดๆ ได้</p>
              </div>
            </section>

            <section id="section-8" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b">8. การชำระเงินและการคืนเงิน</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>8.1 <strong>การชำระเงินตามรอบ:</strong> ระบบมีการเรียกเก็บเงิน 3 รอบ คือ 1. ค่าสินค้า 2. ค่าขนส่งจีน-ไทย และ 3. ค่าขนส่งในไทย ลูกค้าจะต้องชำระเงินให้ครบถ้วนในแต่ละรอบก่อน ระบบจึงจะดำเนินการในขั้นตอนต่อไปได้ <em>(ยกเว้นบริการนำเข้าอย่างเดียว ที่จะไม่มีการเรียกเก็บค่าสินค้ารอบที่ 1)</em></p>
                <p>8.2 <strong>การคืนเงิน:</strong> กรณีร้านค้าจีนไม่มีสินค้า ส่งสินค้าไม่ครบ หรือยกเลิกคำสั่งซื้อ บริษัทจะดำเนินการประสานงานขอเงินคืนจากร้านค้าจีนให้ และจะคืนเงินเข้าสู่ระบบ (Wallet) หรือบัญชีธนาคารของลูกค้า <strong>ตามจำนวนเงินจริงที่ร้านค้าจีนโอนคืนมาเท่านั้น</strong></p>
                <p>8.3 ในกรณีที่บริษัทได้โอนเงินค่าสินค้าไปแล้ว แต่ร้านค้าจีนปิดหนี โกง หรือไม่ยอมคืนเงิน บริษัทจะพยายามช่วยเหลือในการรายงานและดำเนินคดีตามแพลตฟอร์ม แต่จะไม่สามารถสำรองเงินคืนให้ลูกค้าล่วงหน้าได้</p>
              </div>
            </section>
            
            <div className="pt-10 mt-10 border-t-2 border-dashed border-slate-200 text-center">
              <p className="text-sm font-semibold text-slate-500 max-w-lg mx-auto">
                ด้วยการทำรายการและใช้บริการของ Sabuy Ship Express <br className="hidden sm:block" />
                ถือว่าท่านได้ยอมรับเงื่อนไขและข้อตกลงข้างต้นทุกประการ
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
