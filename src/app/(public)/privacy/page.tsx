import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AlertTriangle, Database, FileText, Lock, Mail, Share2, ShieldCheck, UserCheck } from "lucide-react"
import { hasLegalIdentity, publicBusinessConfig } from "@/lib/public-business-config"

export const metadata: Metadata = {
  title: "ประกาศความเป็นส่วนตัว - Sabuy Ship Express",
  description: "ประกาศการเก็บ ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคล",
}

const Section = ({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: ReactNode }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Icon className="h-5 w-5" /></div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    <div className="space-y-3 pl-0 leading-relaxed text-slate-600 md:pl-14">{children}</div>
  </section>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">ประกาศความเป็นส่วนตัว</h1>
        <p className="text-slate-500">ฉบับปรับปรุงวันที่ 14 กันยายน 2026</p>
      </div>

      <div className="space-y-8 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className={`rounded-xl border p-4 text-sm ${hasLegalIdentity ? "border-blue-200 bg-blue-50 text-blue-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}>
          <div className="flex gap-3">
            {!hasLegalIdentity && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
            <div>
              <p className="font-bold">ผู้ควบคุมข้อมูลส่วนบุคคล</p>
              <p>{publicBusinessConfig.brandName} ดำเนินงานโดยผู้ประกอบการบุคคลธรรมดา: {publicBusinessConfig.legalName || "ยังไม่ได้ระบุ"}</p>
              <p>ที่อยู่: {publicBusinessConfig.address || "ยังไม่ได้ระบุ"}</p>
              <p>{publicBusinessConfig.phone ? `โทร: ${publicBusinessConfig.phone} · ` : ""}อีเมล: {publicBusinessConfig.email} · LINE: @sabuyship</p>
              {!hasLegalIdentity && <p className="mt-2 font-bold">ต้องกรอกชื่อ ที่อยู่ และช่องทางติดต่อของผู้ประกอบการก่อนเปิดรับข้อมูลจากลูกค้าจริง</p>}
            </div>
          </div>
        </div>

        <Section icon={UserCheck} title="1. ข้อมูลที่เก็บรวบรวม">
          <ul className="list-disc space-y-1 pl-5">
            <li>ข้อมูลบัญชีและติดต่อ เช่น ชื่อ อีเมล เบอร์โทร LINE ID และข้อมูลจากผู้ให้บริการเข้าสู่ระบบที่ท่านเลือก</li>
            <li>ข้อมูลคำขอและคำสั่งซื้อ เช่น ลิงก์สินค้า รายละเอียดสินค้า เลขพัสดุ และข้อความติดต่อ</li>
            <li>ข้อมูลจัดส่ง เช่น ชื่อผู้รับ เบอร์โทร และที่อยู่</li>
            <li>ข้อมูลธุรกรรม เช่น ยอดชำระ วันเวลา สถานะ และภาพหลักฐานการโอน</li>
            <li>ข้อมูลทางเทคนิคที่จำเป็นต่อความปลอดภัยและการทำงาน เช่น IP, บันทึกการเข้าใช้, คุกกี้เข้าสู่ระบบ และคุกกี้ภาษา</li>
          </ul>
        </Section>

        <Section icon={FileText} title="2. วัตถุประสงค์และฐานกฎหมาย">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>ดำเนินการตามคำขอหรือสัญญา:</strong> ออกใบเสนอราคา สั่งซื้อ ขนส่ง รับชำระ คืนเงิน และบริการลูกค้า</li>
            <li><strong>ปฏิบัติตามกฎหมาย:</strong> ภาษี บัญชี ศุลกากร การตรวจสอบธุรกรรม และคำสั่งของหน่วยงานที่มีอำนาจ</li>
            <li><strong>ประโยชน์โดยชอบด้วยกฎหมาย:</strong> ป้องกันทุจริต รักษาความปลอดภัย แก้ข้อพิพาท และปรับปรุงบริการ โดยคำนึงถึงสิทธิของท่าน</li>
            <li><strong>ความยินยอม:</strong> ใช้เฉพาะกิจกรรมที่กฎหมายกำหนดให้ต้องขอ เช่น การตลาดที่ไม่เกี่ยวกับบริการ โดยท่านถอนความยินยอมได้</li>
          </ul>
        </Section>

        <Section icon={Share2} title="3. ผู้รับข้อมูลและการส่งข้อมูลต่างประเทศ">
          <p>เราเปิดเผยข้อมูลเท่าที่จำเป็นแก่ร้านค้าและโกดังในจีน ผู้ให้บริการขนส่ง ธนาคาร ผู้ให้บริการระบบคลาวด์/ฐานข้อมูล ระบบยืนยันตัวตน LINE และผู้ให้บริการติดตามพัสดุ รวมถึงหน่วยงานรัฐเมื่อมีกฎหมายหรือคำสั่งรองรับ</p>
          <p>การสั่งซื้อและขนส่งจากจีนอาจต้องส่งข้อมูลบางส่วนไปต่างประเทศ เราจะส่งเฉพาะข้อมูลที่จำเป็นต่อบริการและจัดให้มีมาตรการคุ้มครองที่เหมาะสมตามกฎหมาย</p>
          <p>เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลภายนอก</p>
        </Section>

        <Section icon={Database} title="4. ระยะเวลาเก็บรักษา">
          <ul className="list-disc space-y-1 pl-5">
            <li>คำขอใบเสนอราคาที่ไม่เกิดคำสั่งซื้อ: ไม่เกิน 2 ปีหลังการติดต่อครั้งสุดท้าย</li>
            <li>คำสั่งซื้อ การชำระ และเอกสารที่เกี่ยวข้อง: ตามระยะเวลาที่กฎหมายภาษี บัญชี ศุลกากร หรืออายุความกำหนด โดยทั่วไปไม่เกิน 10 ปี</li>
            <li>บัญชีผู้ใช้และที่อยู่: ตลอดเวลาที่ใช้บัญชี และช่วงเวลาที่จำเป็นหลังปิดบัญชีเพื่อปฏิบัติตามกฎหมายหรือจัดการข้อพิพาท</li>
            <li>บันทึกความปลอดภัย: เท่าที่จำเป็นต่อการตรวจสอบและป้องกันเหตุ</li>
          </ul>
          <p>เมื่อพ้นความจำเป็น เราจะลบ ทำลาย หรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้อย่างเหมาะสม</p>
        </Section>

        <Section icon={Lock} title="5. การรักษาความมั่นคงปลอดภัย">
          <p>เราใช้การกำหนดสิทธิ์ตามบทบาท การตรวจสอบตัวตน การเชื่อมต่อแบบเข้ารหัส การสำรองข้อมูล และการจำกัดอายุลิงก์สำหรับเอกสารสำคัญตามความเหมาะสม อย่างไรก็ดีไม่มีระบบใดปลอดความเสี่ยงทั้งหมด หากเกิดเหตุละเมิดข้อมูล เราจะประเมินและแจ้งตามหน้าที่ที่กฎหมายกำหนด</p>
        </Section>

        <Section icon={ShieldCheck} title="6. สิทธิของเจ้าของข้อมูล">
          <p>ภายใต้เงื่อนไขของกฎหมาย ท่านอาจขอเข้าถึงหรือรับสำเนา ขอแก้ไข ขอให้ลบ ขอจำกัดการใช้ ขอคัดค้าน ขอรับหรือโอนข้อมูล ถอนความยินยอม และร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลได้ การถอนความยินยอมไม่กระทบการประมวลผลที่ชอบด้วยกฎหมายก่อนถอน</p>
        </Section>

        <Section icon={Mail} title="7. การใช้สิทธิและการติดต่อ">
          <p>ติดต่อที่ <a className="font-semibold text-primary underline" href={`mailto:${publicBusinessConfig.email}`}>{publicBusinessConfig.email}</a> หรือ LINE @sabuyship โปรดระบุสิทธิที่ต้องการใช้และข้อมูลสำหรับยืนยันตัวตน เราจะตอบภายในระยะเวลาที่กฎหมายกำหนด</p>
          <p>หากมีการเปลี่ยนแปลงสาระสำคัญ เราจะแสดงวันที่ปรับปรุงและแจ้งผ่านช่องทางที่เหมาะสมก่อนมีผล</p>
        </Section>
      </div>
    </div>
  )
}
