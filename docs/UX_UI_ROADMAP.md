# Sabuyship UX/UI Improvement Roadmap

จัดทำขึ้นตามผลการตรวจสอบระบบร่วมกับเกณฑ์มาตรฐาน **UI/UX Pro Max** (`ux-guidelines.csv`, `nextjs.csv`, `shadcn.csv`, `html-tailwind.csv`, `ui-reasoning.csv`)  
เป้าหมาย: ยกระดับความน่าเชื่อถือ ความชัดเจนของระบบชำระเงิน 3 รอบ การใช้งานบนมือถือ (Mobile-first 390px) และมาตรฐาน Accessibility (WCAG 2.2 AA) โดยไม่กระทบ Business Logic เดิมของ Supabase และ Next.js App Router

---

## สรุปภาพรวมแผนงาน (3 Phases)

| Phase | เป้าหมายหลัก | ความเร่งด่วน | ขอบเขตโดยย่อ |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Quick Wins & Critical Stability** | `P0 Critical` | **[DONE]** ปิดจุดหลุด Error Stack Trace, แก้ปุ่มลอยทับซ้อนบนมือถือ, แยก Modal ลูกค้าออกจาก Shell แอดมิน |
| **Phase 2** | **3-Round Payment Clarity & Modern Feedback** | `P1 High` | **[DONE]** ปรับ Stepper/ป้ายสถานะ 3 รอบให้ไม่งง, ลบโค้ดอังกฤษดิบ, เลิกใช้ `alert/confirm/prompt/reload` และอัปเกรดหน้า Admin/Charts |
| **Phase 3** | **Design System, Touch Targets & A11y Polish** | `P2 Medium` | **[DONE]** รวม Modal เป็น Radix มาตรฐานเดียว, ขยาย Touch Target ≥44px, ผูก Form Labels/ARIA, แก้ Token & i18n ให้ครบ |

---

## Phase 1: Quick Wins & Critical Stability (`P0`) — `[DONE 2026-11-16]`

### [x] `UX-1.1` ปิดการแสดงผล Error JSON และ Stack Trace ดิบในหน้ารายละเอียดออเดอร์
- **Priority:** `P0 Critical`
- **UI/UX Pro Max Ref:** `#33 Interaction - Error Feedback`, `#6 Next.js - Handle errors with error.tsx`
- **Target Files:**
  - `src/app/dashboard/orders/[id]/page.tsx` (L77–80, L640–646)
  - `src/app/admin/orders/[id]/page.tsx` (L537–542)
  - (เสริม) สร้าง `src/app/dashboard/error.tsx`
- **ปัญหาปัจจุบัน:** เมื่อ query ล้มเหลวหรือเกิด exception หน้าเว็บเรนเดอร์ `SUPABASE ERROR: {JSON.stringify(error)}` และ `{err.stack}` ให้ผู้ใช้เห็นโดยตรง
- **แนวทางแก้ไข:**
  1. Log รายละเอียด error ไว้ฝั่ง Server (`console.error`) เท่านั้น
  2. เรนเดอร์ Error Card ภาษาไทยที่สุภาพ (เช่น `"ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"`) พร้อมปุ่มกลับหน้ารายการ และปุ่มติดต่อ LINE OA
  3. เพิ่ม `src/app/dashboard/error.tsx` เพื่อดัก error ของโซนลูกค้าแบบมีปุ่ม `reset()` เช่นเดียวกับฝั่ง Admin
- **Definition of Done:** ไม่มี `err.stack` หรือ `JSON.stringify(error)` ใน JSX ของหน้าลูกค้าและแอดมิน

### [x] `UX-1.2` แก้ปัญหาปุ่มลอยทับซ้อนกันบนมือถือ (Mobile Overlay Collisions)
- **Priority:** `P0 Critical`
- **UI/UX Pro Max Ref:** `#15 Layout - Z-Index Management`, `#100 Focus Not Obscured`, `Safe-Area Compliance`
- **Target Files:**
  - `src/components/calculator/QuickRmbCalculator.tsx` (L96)
  - `src/components/orders/PaymentStepper.tsx` (L257–258)
  - `src/components/layout/MobileBottomNav.tsx` (L41, L59–61, L98–114)
  - `src/app/(auth)/layout.tsx` (L9, L16–18)
  - `src/app/dashboard/layout.tsx` (L72, L174, L267)
  - `src/app/layout.tsx` (L51)
- **ปัญหาปัจจุบัน:**
  1. `QuickRmbCalculator` ซ่อนเฉพาะหน้า `/inquiry` แต่ยังลอยอยู่ที่ `bottom-20 left-4 z-40` บนหน้า `/login`, `/register` (บังช่องติ๊กจำอีเมลและปุ่มเข้าสู่ระบบบนมือถือ) และโผล่ในทุกหน้า `/admin/*`
  2. แถบชำระเงินลอยใน `PaymentStepper` ใช้ `bottom-[68px]` โดยไม่รวม `env(safe-area-inset-bottom)` ทำให้ถูก `MobileBottomNav` (`z-50`) บังขอบล่างบน iPhone รุ่นที่มี Home Indicator
  3. บนหน้า `/inquiry` มือถือ ปุ่ม `+` ตรงกลางของ `MobileBottomNav` ยังชี้กลับมาที่ `/inquiry` (หน้าตัวเอง)
  4. `DashboardLayout` ใช้ `<main overflow-y-auto>` ซ้อนกับ `pb-24` ใน `RootLayout` ทำให้พื้นที่เลื่อนจอมือถือขาดช่วง
- **แนวทางแก้ไข:**
  1. อัปเดตเงื่อนไขซ่อน `QuickRmbCalculator` ให้ไม่แสดงบน `/admin`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/complete-profile`, `/inquiry` และ `/invoice`
  2. ปรับตำแหน่ง Floating Pay Pill ใน `PaymentStepper.tsx` เป็น `bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)]` (หรือขยับให้พ้นความสูงจริงของ `MobileBottomNav`) และเพิ่ม `pb-24` ให้เนื้อหาด้านล่างไม่ถูกบัง
  3. บนหน้า `/inquiry` ปรับสถานะปุ่ม `+` กลางล่างของ `MobileBottomNav` ให้แสดงเป็น Active Indicator ที่ไม่กดซ้ำหน้าตัวเอง (หรือปรับสไตล์ปุ่มให้สื่อว่ากำลังอยู่หน้านี้)
  4. ปรับขนาดโลโก้ใน `(auth)/layout.tsx` บนมือถือจาก `h-48 -my-6` ให้กระชับขึ้น (เช่น `h-28 sm:h-36 my-0`) เพื่อให้ฟอร์ม Login/Register พอดีหน้าจอ iPhone โดยไม่ชน Bottom Nav
  5. ปรับ scroll container ของ `DashboardLayout` ไม่ให้โดน `pb-24` ตัดพื้นที่ด้านล่างแบบแข็งทื่อ
- **Definition of Done:** ตรวจดูบน Viewport `390x844` ใน `/login`, `/register`, `/inquiry`, `/dashboard/orders/[id]`, `/admin/orders` ไม่มีการซ้อนทับของปุ่มลอย

### [x] `UX-1.3` นำ `PhoneSetupModal` ออกจาก Admin Layout
- **Priority:** `P0 Critical`
- **UI/UX Pro Max Ref:** `Separation of Concerns / Role-Appropriate UI`
- **Target Files:**
  - `src/app/admin/layout.tsx` (L247)
  - `src/components/dashboard/PhoneSetupModal.tsx` (L186, L248)
- **ปัญหาปัจจุบัน:** `admin/layout.tsx` เรนเดอร์ `<PhoneSetupModal autoCheck />` ซึ่งเป็น modal ฝั่งลูกค้าอยู่ใน shell แอดมิน และตัว modal ตั้ง `autoFocus` ที่ช่องเบอร์โทร ทำให้คีย์บอร์ดมือถือเด้งขึ้นทันทีที่เปิด modal
- **แนวทางแก้ไข:**
  1. ลบ `<PhoneSetupModal autoCheck />` ออกจาก `src/app/admin/layout.tsx`
  2. เอา `autoFocus` ออกจาก input ใน `PhoneSetupModal.tsx` เพื่อให้ผู้ใช้มือถืออ่านคำอธิบายใน modal ได้ก่อนคีย์บอร์ดเด้งบัง

---

## Phase 2: 3-Round Payment Clarity, Modern Dialogs & Admin Polish (`P1`) — `[DONE 2026-11-16]`

### [x] `UX-2.1` ปรับความชัดเจนของสถานะการชำระเงิน 3 รอบฝั่งลูกค้า
- **Priority:** `P1 High`
- **UI/UX Pro Max Ref:** `#49 Logistics`, `#166 Status Timeline`, `#113 Essential Text Truncation`
- **Target Files:**
  - `src/components/orders/PaymentStepper.tsx` (L101, L119)
  - `src/app/dashboard/orders/[id]/page.tsx` (L120–148, L489–494)
  - `src/app/dashboard/page.tsx` (L52–84)
  - `src/app/dashboard/orders/UnifiedOrderList.tsx` (L123–194)
  - `src/lib/` (สร้าง/รวม helper กลางสำหรับแปลสถานะออเดอร์ฝั่งลูกค้า)
- **ปัญหาปัจจุบัน:**
  1. รอบที่ 2 และ 3 ใน `PaymentStepper` ขึ้นสีฟ้า ("Active") ทันทีหลังจ่ายรอบก่อนหน้า ทั้งที่สินค้ายังไม่ถึงโกดังจีน/ไทย (ยอดค่าส่งยังเป็น `0` และยังไม่มีปุ่มจ่าย)
  2. สรุปยอดใน `dashboard/orders/[id]/page.tsx` ใช้คำว่า `"ยอดรวมสุทธิ"` สำหรับยอดรอบ 1 (`quotation.total_price`) ทำให้ลูกค้าเข้าใจผิดว่ารวมค่าส่งครบทั้ง 3 รอบแล้ว
  3. หน้ารายละเอียดออเดอร์ยังแสดงโค้ดภาษาอังกฤษท้ายสถานะ (`NEW`, `WAITING PAYMENT`, `CHINA WAREHOUSE`) และใช้คำเรียกสถานะไม่ตรงกับ `UnifiedOrderList.tsx` และ `dashboard/page.tsx`
- **แนวทางแก้ไข:**
  1. แยกสถานะ Stepper เป็น **4 สถานะภาพจริง**: `เสร็จสิ้น (เขียว)` / `ถึงรอบต้องชำระ (ส้ม/น้ำเงินเด่น)` / `กำลังดำเนินการระหว่างทาง (ฟ้าอ่อน/รอชั่งน้ำหนัก)` / `รอดำเนินการ (เทา)` โดยรอบ 2 จะเป็น Active พร้อมจ่ายเมื่อถึง `CHINA_WAREHOUSE` และมีค่าส่ง `> 0` แล้วเท่านั้น (รอบ 3 เมื่อถึง `THAILAND_WAREHOUSE` และมีค่าส่ง `> 0`)
  2. เปลี่ยนป้าย `"ยอดรวมสุทธิ"` ในใบเสนอราคาเป็น `"ยอดชำระรอบที่ 1 (ค่าสินค้า + ส่งในจีน)"` พร้อมหมายเหตุสั้นๆ ว่าค่าขนส่งจีน-ไทย (รอบ 2) และไทย-ไทย (รอบ 3) จะแจ้งตามน้ำหนักจริงเมื่อถึงโกดัง
  3. รวมฟังก์ชัน `getCustomerOrderStatusLabel()` และสี Badge ไว้ใน `src/lib/constants.ts` (หรือ `src/lib/order-status.ts`) ที่เดียว ให้ `dashboard/page.tsx`, `UnifiedOrderList.tsx` และ `dashboard/orders/[id]/page.tsx` แสดงข้อความภาษาไทยตรงกัน 100% โดยตัดโค้ดอังกฤษวงเล็บท้ายออก
- **Definition of Done:** ลูกค้าดูสถานะออเดอร์เดียวกันจากทุกหน้าได้ข้อความตรงกัน ไม่มีโค้ดอังกฤษ และไม่เข้าใจผิดว่าต้องโอนรอบ 2/3 ก่อนของถึงโกดัง

### [x] `UX-2.2` เปลี่ยน Browser Native Dialogs (`alert` / `confirm` / `prompt`) และ `window.location.reload()` เป็น UI มาตรฐาน
- **Priority:** `P1 High`
- **UI/UX Pro Max Ref:** `#32 Loading Buttons`, `#35 Confirmation Dialogs`, `#42 AlertDialog for Confirms`
- **Target Files:**
  - **Customer:** `src/app/dashboard/orders/UnifiedOrderList.tsx` (L44, L63–67, L104–105), `src/app/dashboard/addresses/page.tsx` (L46, L56), `src/components/orders/PaymentSection.tsx` (L271)
  - **Admin:** `src/app/admin/orders/page.tsx` (L301–518), `src/app/admin/inquiries/AdminInquiryList.tsx` (L295–430), `src/app/admin/tracking/page.tsx` (L108, L113), `src/app/admin/refunds/RefundActions.tsx` (L12–17), `src/app/admin/customers/AdminCreateInquiryModal.tsx` (L130), `src/components/admin/ChinaTrackingModal.tsx` (L120)
- **ปัญหาปัจจุบัน:** ยังมีการเรียก `alert()`, `confirm()`, `prompt()` ของเบราว์เซอร์มากกว่า 30 จุด และใช้ `window.location.reload()` ทำให้หน้ากระพริบและกรอกข้อมูลบนมือถือลำบาก
- **แนวทางแก้ไข:**
  1. สร้าง Reusable `<ConfirmDialog />` (ครอบ Radix `AlertDialog` / `Dialog`) สำหรับการยืนยันลบที่อยู่, รวมบิล, ปฏิเสธคำขอ, ล้างรูป, และยืนยันรับเงินแมนนวล (มีช่องกรอกเหตุผล/เลขอ้างอิงพร้อม validation แทน `window.prompt`)
  2. เปลี่ยน `alert(...)` ทุกจุดเป็น `toast.success(...)` / `toast.error(...)` ของ Sonner
  3. เปลี่ยน `window.location.reload()` เป็น `router.refresh()` พร้อม state update ทันที

### [x] `UX-2.3` ยกระดับ Admin Imports, Dashboard Charts, Breadcrumbs และ Status Colors
- **Priority:** `P1 High`
- **UI/UX Pro Max Ref:** `#7 Analytics Dashboard`, `#102 Inventory/Warehouse`, `#112 Text Reflow`
- **Target Files:**
  - `src/app/admin/imports/page.tsx` (L12, L24–38)
  - `src/components/admin/DashboardCharts.tsx` (L64, L92–103)
  - `src/app/admin/layout.tsx` (L155–162)
  - `src/app/admin/orders/page.tsx` (L546–548) vs `src/app/admin/tracking/page.tsx` (L14–16)
  - `src/app/dashboard/orders/UnifiedOrderList.tsx` (L344–350, L489–493)
- **แนวทางแก้ไข:**
  1. **Unified Admin Status Colors:** ใช้ Mapping สีสถานะกลางชุดเดียวกันทั้ง `admin/orders`, `admin/orders/[id]` และ `admin/tracking` (`CHINA_WAREHOUSE` = ม่วง, `SHIPPING` = ฟ้า, `THAILAND_WAREHOUSE` = เขียวอมฟ้า `teal`)
  2. **Mobile Imports View:** เพิ่ม Mobile Card View, Pagination (แทน `.limit(100)` ตายตัว) และ `loading.tsx` / Skeleton ใน `/admin/imports`
  3. **Responsive Charts:** ใน `DashboardCharts.tsx` ตั้ง `interval="preserveStartEnd"` (หรือสลับโชว์สรุป 7 วันบนจอมือถือ `<640px`) เพื่อไม่ให้วันที่แกน X และแท่งกราฟ 60 แท่งเบียดทับกัน
  4. **Clickable Breadcrumbs:** ทำให้ `ระบบแอดมิน / คำสั่งซื้อ` ใน `admin/layout.tsx` กดย้อนกลับไปยังหน้ารวมของส่วนนั้นได้
  5. **Actionable Empty States:** เพิ่มปุ่ม CTA `"ขอใบเสนอราคาสินค้าใหม่"` ใน Empty State ของ `UnifiedOrderList.tsx` (และหน้าลูกค้าอื่นๆ เมื่อยังไม่มีข้อมูล)

---

## Phase 3: Design System, Touch Targets & Accessibility Polish (`P2`) — `[DONE 2026-11-16]`

### [x] `UX-3.1` รวมระบบ Modal ทั้งหมดเป็นมาตรฐานเดียว (Radix UI Dialog)
- **Priority:** `P2 Medium`
- **UI/UX Pro Max Ref:** `#11 Dialog`, `#13 Dialog Structure`, `#53 Focus Management`
- **Target Files:**
  - `src/components/ui/dialog.tsx` (มาตรฐานหลัก)
  - `src/components/ui/custom-dialog.tsx` (ย้ายผู้ใช้งานทั้งหมดออกแล้วลบไฟล์ หรือหุ้มด้วย Radix Dialog)
  - `src/components/calculator/QuickRmbCalculator.tsx` (L116–155)
  - `src/app/admin/orders/page.tsx` (L1207–1304 Inline Status Modal)
  - `src/components/dashboard/PhoneSetupModal.tsx` (L184–300)
- **แนวทางแก้ไข:**
  1. ย้ายทุก Modal มาใช้ `@/components/ui/dialog` เพื่อได้ `role="dialog"`, `aria-modal="true"`, Focus Trap, การกด `Escape` เพื่อปิด, `DialogTitle`, และคืน Focus ให้ปุ่มเดิมอัตโนมัติ
  2. ทำให้ Dropdown เมนูโปรไฟล์ใน `navbar.tsx` (L133–165) มี `aria-expanded`, `aria-haspopup="menu"`, `role="menu"`, `role="menuitem"`, และรองรับปุ่ม `Escape`

### [x] `UX-3.2` ขยาย Touch Target บนมือถือให้ ≥ 44×44px และแก้ Layout มือถือ
- **Priority:** `P2 Medium`
- **UI/UX Pro Max Ref:** `#22 Touch Target Size`, `#66 Touch Friendly`, `#104 Target Size`, `#112 Text Reflow`
- **Target Files:**
  - `src/components/layout/navbar.tsx` (L274–309) & `src/components/layout/footer.tsx` (L57)
  - `src/app/dashboard/layout.tsx` (L196, L203, L215–255)
  - `src/app/dashboard/addresses/page.tsx` (L152–157, L176)
  - `src/app/dashboard/orders/UnifiedOrderList.tsx` (L392–396)
  - `src/components/dashboard/CustomerWarehouseCard.tsx` (L217, L246, L264, L291)
  - `src/components/orders/PaymentSection.tsx` (L328, L501, L510)
  - `src/app/(public)/track/page.tsx` (L225–231, L278–337, L345–370)
  - `src/app/(public)/inquiry/page.tsx` (L504–527, L648)
  - `src/app/(auth)/login/page.tsx` (L285, L292) & `register/page.tsx` (L258, L266)
- **แนวทางแก้ไข:**
  1. ปรับปุ่มไอคอน (Copy, Edit, Delete, Close, Back) ให้มีพื้นที่กดอย่างน้อย `min-h-11 min-w-11` (44px) บนมือถือ (สามารถทำ hit-area ด้วย padding โดยยังดูโปร่ง)
  2. ปรับปุ่ม Social Auth (LINE & Google) จาก `h-[40px]` เป็น `h-[44px]`
  3. ปรับ Mobile Drawer links ใน `navbar.tsx` และ Pills ใน `dashboard/layout.tsx` ให้มี `min-h-[44px] flex items-center`
  4. ปรับ Stepper 5 ขั้นตอนใน `track/page.tsx` จาก `grid-cols-5` ตายตัวบนมือถือ เป็น Vertical Timeline หรือ Horizontal Scrollable Stepper เพื่อไม่ให้คำภาษาไทยตัดกลางคำบนจอ 320–375px

### [x] `UX-3.3` ยกระดับ Form UX, Accessibility (`htmlFor`, `aria-label`, Contrast) & Icon Hygiene
- **Priority:** `P2 Medium`
- **UI/UX Pro Max Ref:** `#36 Color Contrast`, `#40 ARIA Labels`, `#43 Form Labels`, `#44 Error Messages`, `#107 Accessible Auth`, `#109 Focusable Error Summary`
- **Target Files:**
  - `src/app/(auth)/register/page.tsx` (L184–238) & `login/page.tsx` (L202–245)
  - `src/app/(public)/inquiry/page.tsx` (L187–208, L417, L517–797)
  - `src/app/(public)/track/page.tsx` (L218, L256) & `pricing/page.tsx` (L354–481)
  - `src/app/admin/orders/page.tsx` (L707, L732, L798–836, L969–1020)
  - `src/app/admin/inquiries/AdminInquiryList.tsx` (L514–539, L647–653, L709–727)
  - `src/components/layout/footer.tsx` (L50) & `src/app/(public)/page.tsx` (L246)
  - `src/app/dashboard/profile/page.tsx` (L55–58, L77)
- **แนวทางแก้ไข:**
  1. ผูก `htmlFor` + `id` ให้ครบทุก `<label>` / `<Input>` และเติม `autoComplete` (`name`, `tel`, `email`, `new-password`) รวมถึง `minLength={6}` ในหน้าสมัครสมาชิก
  2. แยก `<Link href="/privacy">` ออกจาก `<label>` ของ Checkbox ในหน้า Register และ Inquiry เพื่อไม่ให้แตะอ่านประกาศแล้ว Checkbox เปลี่ยนค่าเอง
  3. เพิ่มปุ่ม Toggle แสดง/ซ่อนรหัสผ่านในหน้า Login/Register
  4. เพิ่ม `role="alert"` ให้กล่อง Error ทุกหน้า และในฟอร์ม `inquiry/page.tsx` เมื่อ validation พลาดให้ scroll ไปยัง Error banner ด้านบนอัตโนมัติ
  5. เติม `aria-label` ให้ปุ่มไอคอนและ Checkbox ตารางทุกตัว, ใส่ `aria-hidden="true"` ให้ไอคอนตกแต่ง, และทยอยแทนที่ Emoji โครงสร้าง (`🚚`, `🛳️`, `📦`, `🇨🇳`) ด้วย SVG Icons (`lucide-react` / Flag icons)
  6. ปรับ Contrast ข้อความรองที่ต่ำกว่า 4.5:1 (`slate-400` บนพื้นขาว -> `slate-500`/`slate-600`, และ `text-slate-500` บน `#06152f` ใน Footer -> `text-slate-300`)
  7. เปลี่ยนการตรวจเบอร์โทรใน `dashboard/profile/page.tsx` มาใช้ `isValidThaiPhone` / `normalizeThaiPhone` จาก `src/lib/phone.ts` (DRY) และใช้ `toast.success` แทน timeout banner

### [x] `UX-3.4` มาตรฐาน Design Tokens, Typography, Images และ Multi-language (i18n)
- **Priority:** `P2 Medium`
- **UI/UX Pro Max Ref:** `#4 CSS Variables`, `#17 next/image`, `#56 Static Class Tokens`, `#58 Long Token Resilience`
- **Target Files:**
  - `src/app/globals.css` (L4, L9–10, L47–81, L118–148)
  - `src/app/layout.tsx` (L46)
  - `src/app/dashboard/layout.tsx` (L235) & `src/components/dashboard/CustomerWarehouseCard.tsx` (L201)
  - `src/app/(public)/pricing/page.tsx` (L161–178)
  - `src/app/(auth)/layout.tsx` (L17), `src/components/layout/navbar.tsx` (L139–235), `src/app/(public)/inquiry/page.tsx` (L631)
  - `src/components/calculator/QuickRmbCalculator.tsx`, `src/components/layout/navbar.tsx` (L150–264), `src/app/(public)/page.tsx`
- **แนวทางแก้ไข:**
  1. แยก `--font-mono` ใน `globals.css` ให้ใช้ Monospace Font จริง (เช่น `JetBrains Mono` / `ui-monospace`) เพื่อให้เลขพัสดุ รหัสลูกค้า (`M-SA001`) และตัวเลขเงินในตารางจัดแนวตรงกัน (tabular-nums)
  2. ลบคลาสที่ไม่คอมไพล์ (`py-0.2` -> `py-0.5`) และลบคลาส `dark:` ที่ไม่ได้ใช้งานใน `pricing/page.tsx`
  3. ปรับสี Hardcode ใน `globals.css`, `footer.tsx`, `page.tsx` ให้ยึด CSS Tokens (`--primary`, `--border`, `--card`) และจัดทำเอกสาร `design-system/sabuyship/MASTER.md` เพื่อคุมความสม่ำเสมอของรัศมีขอบและเงา
  4. เปลี่ยนแท็ก `<img>` ดิบใน `(auth)/layout.tsx`, `navbar.tsx` (ธงชาติ/อวาตาร์) และ `inquiry/page.tsx` เป็น `next/image` (พร้อมกำหนด `width`/`height` ป้องกัน CLS)
  5. อัปเดต `document.documentElement.lang` ใน `LanguageProvider` ตามภาษาที่เลือก (`th`/`en`/`zh`) และย้ายข้อความภาษาไทยที่ฮาร์ดโค้ดใน Navbar dropdown และ `QuickRmbCalculator` เข้า `src/lib/i18n.ts`

---

## Phase 4: Post-Audit P0–P1 Fixes (`P0` & `P1`) — `[DONE 2026-11-16]`

### [x] `UX-4.1` แก้ไข Error Boundary Runtime Bug (`unstable_retry` -> `retry`) และ Error Fallback หน้า Overview
- **Target Files:** `src/app/dashboard/error.tsx`, `src/app/admin/error.tsx`, `src/app/admin/page.tsx`
- **สิ่งที่แก้ไข:** เปลี่ยน prop ของ Error Boundary จาก `unstable_retry` เป็น `retry` ตามสัญญา API จริงของ Next.js 16 และเพิ่ม `unstable_rethrow(err)` + `OrderDetailErrorCard` ใน `src/app/admin/page.tsx` รวมถึงทำรายการคำขอประเมินราคาล่าสุดและเลขคำสั่งซื้อในอัปเดตขนส่งให้กดเข้าลิงก์ปลายทางได้

### [x] `UX-4.2` ปรับข้อมูลการชำระเงินรอบ 2 ในหน้า Public และ Modal ใบเสนอราคาให้ตรงตาม Business Logic 3 รอบ
- **Target Files:** `src/app/(public)/how-it-works/page.tsx`, `src/app/(public)/faq/page.tsx`, `src/app/dashboard/orders/UnifiedOrderList.tsx`
- **สิ่งที่แก้ไข:** แก้คำอธิบายทั้ง TH/EN/ZH ให้ระบุตรงกันว่ารอบ 2 คิดค่าขนส่งจีน-ไทยและแจ้งชำระเมื่อสินค้าถึง **โกดังจีน (กว่างโจว)** (ก่อนส่งเข้าไทย) และเปลี่ยนข้อความ `"ยอดสุทธิ (Grand Total)"` ใน Modal ดูใบเสนอราคาของลูกค้าเป็น `"ยอดชำระรอบที่ 1 (ค่าสินค้า + ค่าส่งในจีน)"` พร้อมหมายเหตุรอบ 2 และ 3

### [x] `UX-4.3` แก้ไข Accessibility, Label Nesting, Form Validation (DRY) และ URL Query Syncing
- **Target Files:** `src/app/(public)/contact/page.tsx`, `src/app/(auth)/complete-profile/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/dashboard/addresses/AddressFormModal.tsx`, `src/app/dashboard/profile/page.tsx`, `src/components/orders/PaymentStepper.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/orders/new/page.tsx`, `src/app/admin/inquiries/AdminInquiryList.tsx`, `src/app/admin/settings/page.tsx`, `src/app/admin/tracking/TrackingUpdateModal.tsx`, `src/app/admin/tracking/page.tsx`, `src/app/admin/customers/page.tsx`
- **สิ่งที่แก้ไข:**
  - แยก `<Link href="/privacy">` ออกจาก `<label>` ใน `contact/page.tsx`
  - ใช้ `isValidThaiPhone`/`normalizeThaiPhone` จาก `@/lib/phone` และซ่อนข้อความ error ดิบของ Supabase ใน `complete-profile/page.tsx` และ `AddressFormModal.tsx`
  - เติม `htmlFor`/`id`/`autoComplete`, `role="alert"`/`role="status"`, `aria-label`, `alt` บนรูปภาพมือถือใน `AdminInquiryList.tsx`, และ `aria-expanded`/`aria-controls` บน FAQ Accordions
  - ซิงค์ `?status=` ด้วย `useSearchParams` ภายใต้ `<Suspense>` ใน `admin/orders/page.tsx`
  - แยก `aria-label` ของ `<nav>` เดสก์ท็อป/มือถือ, เพิ่ม `target="_blank" rel="noopener noreferrer"` และปุ่ม `min-h-11` บนมือถือใน `admin/layout.tsx`, แก้ `colSpan={7}` ใน `admin/tracking/page.tsx` และกันลิงก์ `href="tel:"` ว่างใน `admin/customers/page.tsx`

---

## แนวทางการตรวจรับงานหลังแก้แต่ละ Phase

ทุกครั้งที่ปิดงานแต่ละ Task/Phase ต้องผ่านขั้นตอนต่อไปนี้:
1. `npm run test:auth-safety` และ `npm run typecheck` (รวม `code:clean` zero-dead-code) ผ่าน 0 errors
2. `npm run build` ผ่านครบทุก route
3. ทดสอบหน้าจอจริงทั้ง Desktop (1440px) และ Mobile (390×844px) โดยเฉพาะ:
   - Keyboard tab navigation + Escape ปิด Modal
   - Virtual keyboard focus บนฟอร์มมือถือ (Login, Inquiry, Payment Slip Upload)
   - ไม่มีการล้นขอบแนวนอน (No horizontal overflow) และไม่มีปุ่มลอยซ้อนทับกัน
4. อัปเดตสถานะในเอกสารนี้ (`[x]`) และ `docs/ai/HANDOFF.md` ทุกครั้งหลังส่งมอบ

