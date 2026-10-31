# SabuyShip Web Platform

ระบบสั่งซื้อและนำเข้าสินค้าจากจีน-ไทยครบวงจร (Taobao, 1688, Tmall) พัฒนาด้วย **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4** และ **Supabase (PostgreSQL + Auth + Storage)**

---

## 1. โครงสร้างโปรเจกต์ (Project Architecture)

```text
sabuyship-web/
├── src/
│   ├── app/
│   │   ├── (public)/        # หน้าเว็บสาธารณะ (หน้าแรก, ขอใบเสนอราคา, เช็คพัสดุ, อัตราค่าบริการ, ติดต่อเรา)
│   │   ├── (auth)/          # ระบบสมาชิก (เข้าสู่ระบบ, สมัครสมาชิก, ลืมรหัสผ่าน, ตั้งรหัสผ่านใหม่)
│   │   ├── dashboard/       # ระบบจัดการของลูกค้า (ภาพรวม, คำสั่งซื้อ, สมุดที่อยู่, ข้อมูลส่วนตัว, ใบแจ้งหนี้)
│   │   ├── admin/           # ระบบจัดการแอดมิน (คำขอราคา, คำสั่งซื้อ, Tracking, นำเข้า Excel, เงินคืน, ลูกค้า, แจ้งเตือน, ตั้งค่า)
│   │   └── api/             # REST API Route Handlers (แยกตามสิทธิ์ Customer / Admin / Public / Webhook)
│   ├── components/
│   │   ├── admin/           # โมดอลและคอมโพเนนต์ฝั่งแอดมิน (QuoteModal, ChinaTrackingModal, PaymentApprovalModal ฯลฯ)
│   │   ├── dashboard/       # คอมโพเนนต์ฝั่งลูกค้า (CustomerWarehouseCard, PhoneSetupModal ฯลฯ)
│   │   ├── layout/          # โครงสร้างหลัก (Navbar, Footer, NotificationBell, MobileBottomNav, FloatingLineButton)
│   │   ├── orders/          # ระบบแสดงผลคำสั่งซื้อและชำระเงิน 3 รอบ (PaymentSection, PaymentStepper, UnifiedOrderList)
│   │   └── ui/              # Base UI Primitives (Button, Input, Card, Dialog, CustomDialog ฯลฯ)
│   └── lib/
│       ├── supabase/        # Supabase Clients (client.ts, server.ts, admin.ts, middleware.ts)
│       ├── api-auth.ts      # ตรวจสอบสิทธิ์ผู้ใช้งานฝั่ง API (Customer & Admin Guards)
│       ├── require-admin.ts # ตรวจสอบสิทธิ์ Admin สำหรับ API เฉพาะแอดมิน
│       ├── constants.ts     # ค่าคงที่หลักของระบบ (LINE OA, Order Statuses, Payment Statuses)
│       ├── phone.ts         # ฟังก์ชันตรวจสอบเบอร์โทรศัพท์ไทยและสร้างรหัสสมาชิก
│       ├── notify.ts        # ระบบส่งแจ้งเตือน LINE Messaging API (Multicast & Group Push)
│       ├── product-link.ts  # ระบบสกัดลิงก์สินค้าอัตโนมัติจากข้อความแชร์ Taobao / 1688 / Tmall
│       └── i18n.ts          # ระบบรองรับ 3 ภาษา (TH / EN / ZH)
├── supabase/
│   └── migrations/          # SQL Schema Migrations & RLS Policies
├── scripts/                 # สคริปต์ตรวจสอบความพร้อมของฐานข้อมูลและระบบ (Schema Check, Business Check, Auth Safety)
└── docs/                    # เอกสารสถาปัตยกรรมและการส่งมอบงาน (AI Handoff, Decisions, Tasks)
```

---

## 2. กระบวนการทำงานหลัก (3-Round Payment Workflow)

1. **ขอใบเสนอราคา (`inquiries` $\rightarrow$ `quotations`):**
   - ลูกค้าวางลิงก์หรือข้อความแชร์จากแอปจีน แอดมินประเมินราคาสินค้าและค่าส่งในจีน
2. **ชำระเงินรอบที่ 1 (ค่าสินค้า + ค่าส่งในจีน):**
   - ลูกค้าแนบสลิปโอนเงิน แอดมินตรวจสอบและกดอนุมัติ สถานะเปลี่ยนเป็น `ORDERED`
3. **แจ้งเลขแทร็กขนส่งจีน (`tracking_numbers_cn`):**
   - แอดมินบันทึกเลขแทร็กขนส่งจีนได้หลายหมายเลขต่อออเดอร์/ต่อรายการสินค้าเมื่อร้านค้าจีนจัดส่ง
4. **ชำระเงินรอบที่ 2 (ค่านำเข้าจีน-ไทย):**
   - เมื่อพัสดุถึงโกดังจีน (`CHINA_WAREHOUSE`) แอดมินแจ้งค่านำเข้า ลูกค้าชำระเงินรอบที่ 2 สถานะเปลี่ยนเป็น `SHIPPING`
5. **ชำระเงินรอบที่ 3 (ค่าจัดส่งในไทย):**
   - เมื่อพัสดุถึงโกดังไทย (`THAILAND_WAREHOUSE`) ลูกค้าเลือกขนส่งในไทยและชำระเงินรอบที่ 3 แอดมินจัดส่ง (`OUT_FOR_DELIVERY`) จนลูกค้ากดยืนยันรับสินค้า (`DELIVERED`)

---

## 3. คำสั่งสำหรับการพัฒนาและตรวจสอบระบบ (Developer Commands)

```bash
# รันเซิร์ฟเวอร์สำหรับพัฒนา
npm run dev

# ตรวจสอบความถูกต้องของ TypeScript ทั้งโปรเจกต์
npm run typecheck

# ตรวจสอบโครงสร้างตารางฐานข้อมูล, RLS และ Storage Buckets บน Supabase
npm run schema:check

# ตรวจสอบความพร้อมข้อมูลธุรกิจและทดสอบความปลอดภัยระบบ Auth
npm run business:check
npm run test:auth-safety

# Build ระบบสำหรับใช้งานจริง (Production Build)
npm run build
```
