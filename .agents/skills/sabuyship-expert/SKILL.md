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
- หากมีบัคในหน้า UI ให้เช็คให้แน่ใจว่าแท็ก HTML เช่น `<div>` ถูกปิดอย่างถูกต้อง (เคยเกิด Syntax Error จากวงเล็บปีกกา/Div ตกหล่นตอนแกะโครงสร้าง UI)

## 4. Tracking Logs
- ทุกครั้งที่มีการเปลี่ยนสถานะที่สำคัญของ `orders` หรือการชำระเงิน **ต้องมีการ Insert ข้อมูลลงในตาราง `tracking_logs` เสมอ** เพื่อให้ Customer Timeline แสดงผลได้อย่างถูกต้อง
