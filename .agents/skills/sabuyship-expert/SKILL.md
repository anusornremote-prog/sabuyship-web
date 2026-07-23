---
name: sabuyship-expert
description: ทักษะและความรู้เฉพาะทางสำหรับโปรเจกต์ Sabuyship (ระบบขนส่งและสั่งซื้อสินค้าจีน-ไทย) ช่วยให้ AI เข้าใจ Business Logic, Workflow 3 รอบ และข้อควรระวังในการเขียนโค้ดเชื่อมต่อกับ Supabase
---

# Sabuyship Expert Skill

ทักษะนี้จะถูกเรียกใช้โดยอัตโนมัติเมื่อ AI ต้องทำงานที่เกี่ยวข้องกับโปรเจกต์ Sabuyship เพื่อป้องกันข้อผิดพลาดจากสิ่งที่เคยเกิดขึ้นแล้ว และเพื่อให้เข้าใจ Workflow ของธุรกิจนี้อย่างทะลุปรุโปร่ง

## 1. Core Business Logic (ระบบการชำระเงิน 3 รอบ)
โปรเจกต์นี้มีระบบกระแสเงินสดและสถานะการจัดส่งที่ซับซ้อน แบ่งเป็น 3 รอบ:
- **Round 1 (ค่าสินค้า):** ลูกค้าชำระค่าสินค้า (Status: `PENDING` -> `PAID`)
- **Round 2 (ค่าขนส่งจีน-ไทย):** เมื่อสถานะออเดอร์เป็น `CHINA_WAREHOUSE` แอดมินจะประเมินราคา และลูกค้าต้องชำระเงิน (Field: `payment_round_2_status`)
- **Round 3 (ค่าจัดส่งในไทย):** เมื่อสถานะออเดอร์เป็น `THAILAND_WAREHOUSE` แอดมินจะประเมินราคา ลูกค้าต้องเลือกวิธีการจัดส่ง (`shipping_company`) และชำระเงิน (Field: `payment_round_3_status`)
- **การรับสินค้า:** เมื่อสถานะเป็น `OUT_FOR_DELIVERY` ลูกค้าจะกดยืนยันการรับสินค้า เปลี่ยนสถานะเป็น `DELIVERED` ทันที

## 2. Database & Supabase Conventions
- **Naming Convention:** ฐานข้อมูลใช้ `snake_case` ทั้งหมด ห้ามใช้ `camelCase` ในการอ้างอิงคอลัมน์เด็ดขาด เช่น ต้องใช้ `postal_code` ไม่ใช่ `postalCode` (เคยเกิด Error 42703 มาแล้ว)
- **Column Existence:** ก่อนที่จะเพิ่มคอลัมน์ใหม่ๆ ลงไปในคำสั่ง `.select()` ของฝั่ง Frontend (เช่น หน้า Admin/Customer) **ต้องมั่นใจว่าคอลัมน์นั้นถูกเพิ่มเข้าไปในฐานข้อมูลจริงๆ แล้ว** หรือแนะนำให้ผู้ใช้รันคำสั่ง SQL `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` เพื่อป้องกันไม่ให้หน้าเว็บล่ม (TypeError: fetch failed)
- **Relation Check:** ระวังการดึงข้อมูล Foreign Key เช่น `address:shipping_address_id(...)` และ `quotation:quotation_id(...)` ต้องครอบคลุมกรณีที่ข้อมูลเป็น `null` ด้วย

## 3. UI & Framework
- ใช้ Next.js App Router (React Server Components + Client Components)
- ใช้ TailwindCSS และ shadcn/ui เป็นหลัก
- หากมีบัคในหน้า UI ให้เช็คให้แน่ใจว่าแท็ก HTML เช่น `<div>` หรือแท็ก Component ถูกปิดอย่างถูกต้อง (เคยเกิด Syntax Error จากวงเล็บปีกกา/Div ตกหล่นตอนแกะโครงสร้าง UI)
- **CRITICAL - JSX Tag Placement:** ระวังการตัดแปะ (Cut/Paste) แท็กปิดของ Component เช่น `</CardContent>`, `</DialogContent>` หรือปีกกาของ JSX `{...}` หากจัดวางผิดตำแหน่งจะทำให้เกิด Error `Expected '</', got 'jsx text'` ตอน Build ทันที!
- **CRITICAL - Import Placement:** ห้ามวางคำสั่ง `import` ไว้กลางไฟล์หรือภายในตัวฟังก์ชัน Component เด็ดขาด (ต้องวางไว้บนสุดของไฟล์เสมอ) ไม่เช่นนั้นจะเจอ Error `'import', and 'export' cannot be used outside of module code`
- **CRITICAL - Recharts & SSR:** ไลบรารีกราฟอย่าง Recharts มีปัญหากับการทำ Server-Side Rendering (SSR) ใน Next.js App Router (เนื่องจากมีการเรียกใช้เครื่องมือฝั่งเบราว์เซอร์เช่น `ResizeObserver`) หากปล่อยให้เซิร์ฟเวอร์เรนเดอร์จะทำให้เกิด Server Component Render Error (หน้าเว็บพัง/เด้ง) ทันที ดังนั้นต้องแยก Component กราฟออกมาและโหลดแบบปิด SSR
- **CRITICAL - `next/dynamic` ใน Server Component:** ห้ามใช้ `dynamic(..., { ssr: false })` ภายใน Server Component แบบตรงๆ เด็ดขาด! (จะเกิด Error `ssr: false is not allowed with next/dynamic in Server Components` ตอน Build ขึ้น Vercel) วิธีที่ถูกต้องคือต้องสร้าง Client Component (`'use client'`) แยกเป็น Wrapper ขึ้นมาก่อน แล้วค่อยใช้คำสั่ง `dynamic` ในไฟล์ Wrapper นั้นแทน

## 4. Tracking Logs
- ทุกครั้งที่มีการเปลี่ยนสถานะที่สำคัญของ `orders` หรือการชำระเงิน **ต้องมีการ Insert ข้อมูลลงในตาราง `tracking_logs` เสมอ** เพื่อให้ Customer Timeline แสดงผลได้อย่างถูกต้อง

## 5. Testing & Verification
- **การทดสอบหลังแก้ไข:** ทุกครั้งหลังจากแก้ไขโค้ด ปรับแต่งฟีเจอร์ หรือแก้ไขบั๊กเสร็จสิ้น **ต้องทำการทดสอบการทำงานของระบบ (Testing & Verification) เสมอ** เพื่อให้แน่ใจว่าระบบทำงานได้ถูกต้อง สมบูรณ์ และไม่มีผลกระทบข้างเคียงเกิดขึ้นกับระบบส่วนอื่นๆ

## 6. Implemented Features (ระบบที่มีอยู่แล้ว - ห้ามลืมหรือเสนอทำซ้ำ)
- **ระบบคำนวณและตั้งค่าอัตราแลกเปลี่ยน (Exchange Rate):** มีปุ่มและฟังก์ชันตั้งค่าอัตราแลกเปลี่ยนเงินหยวน (RMB) เป็นบาท (THB) อยู่ในหน้าตั้งค่าของแอดมิน (`src/app/admin/settings/page.tsx`) และนำไปแสดงผลบนหน้าแรกแล้ว
- **ระบบแจ้งเตือนผ่าน LINE OA:** มีการพัฒนา Messaging API (`src/lib/notify.ts`) เพื่อส่งแจ้งเตือนการโอนเงิน/ความเคลื่อนไหวไปยัง LINE ของลูกค้าเรียบร้อยแล้ว
- **ระบบสรุปสถิติ (Admin Dashboard Charts):** มีการสร้างกราฟแสดงสถิติต่างๆ ในหน้าแรกของแอดมิน (`src/app/admin/components/DashboardCharts.tsx`) แล้ว
- **ระบบแก้ไขใบเสนอราคา 3 รอบ:** แอดมินสามารถกดแก้ไขราคาประเมินรอบ 1, 2 และ 3 ได้จนกว่าลูกค้าจะจ่ายเงิน (`payment_status !== 'PAID'`)
