import type { SupabaseClient } from "@supabase/supabase-js"
import { getBangkokDateParts } from "@/lib/date-format"
import { extractStorageObjectPath } from "@/lib/storage-path"

export const TICKET_BUCKET_NAME = "ticket_attachments"
export const MAX_TICKET_ATTACHMENTS = 5

export const TICKET_CATEGORIES = [
  "MISSING_ITEM",
  "DAMAGED_TRANSIT",
  "NOT_AS_DESCRIBED",
  "OTHER",
] as const

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export const TICKET_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const

export type TicketStatus = (typeof TICKET_STATUSES)[number]

export interface TicketCategoryMeta {
  value: TicketCategory
  label: string
  shortLabel: string
  description: string
  evidenceTip: string
}

export const TICKET_CATEGORY_META: Record<TicketCategory, TicketCategoryMeta> = {
  MISSING_ITEM: {
    value: "MISSING_ITEM",
    label: "ของหาย / ได้รับไม่ครบ",
    shortLabel: "ของหาย / ไม่ครบ",
    description: "สินค้ามาไม่ครบตามจำนวน ชิ้นส่วนขาดหาย หรือพัสดุสูญหายระหว่างทาง",
    evidenceTip: "แนะนำ: รูปกล่องพัสดุทั้ง 6 ด้าน รูปใบปะหน้า (Tracking) และภาพสินค้าทั้งหมดที่ได้รับจริงเทียบกับรายการสั่งซื้อ",
  },
  DAMAGED_TRANSIT: {
    value: "DAMAGED_TRANSIT",
    label: "สินค้าเสียหายระหว่างขนส่ง",
    shortLabel: "เสียหายระหว่างขนส่ง",
    description: "กล่องบุบ แตก ชื้น เปียก หรือสินค้าชำรุดเสียหายจากการขนส่ง",
    evidenceTip: "แนะนำ: รูปสภาพกล่องภายนอกก่อนแกะ วัสดุกันกระแทกภายใน จุดที่เสียหาย และแนบลิงก์วิดีโอตอนแกะพัสดุ (ถ้ามี)",
  },
  NOT_AS_DESCRIBED: {
    value: "NOT_AS_DESCRIBED",
    label: "สินค้าไม่ตรงปก / ผิดสเปก",
    shortLabel: "ไม่ตรงปก / ผิดรุ่น",
    description: "ร้านค้าส่งผิดสี ผิดไซส์ ผิดรุ่น หรือคุณภาพ/รายละเอียดไม่ตรงตามลิงก์",
    evidenceTip: "แนะนำ: รูปป้ายแท็กสินค้า สี/รุ่นที่ได้รับจริง ภาพถ่ายชัดๆ เทียบกับรูปจากลิงก์ร้านค้าจีน",
  },
  OTHER: {
    value: "OTHER",
    label: "ปัญหาอื่น ๆ",
    shortLabel: "ปัญหาอื่น ๆ",
    description: "สอบถามหรือขอให้ทีมงานช่วยประสานร้านค้า/ขนส่งในกรณีอื่น ๆ",
    evidenceTip: "แนะนำ: ระบุเลขพัสดุจีนหรือรายละเอียดปัญหาที่พบพร้อมแนบรูปภาพประกอบเพื่อให้ทีมงานประสานงานได้เร็วที่สุด",
  },
}

export interface TicketStatusMeta {
  value: TicketStatus
  label: string
  customerDescription: string
  badgeClass: string
  dotClass: string
}

export const TICKET_STATUS_META: Record<TicketStatus, TicketStatusMeta> = {
  NEW: {
    value: "NEW",
    label: "เปิดเคสใหม่",
    customerDescription: "ระบบได้รับเรื่องแล้ว ทีมงานกำลังตรวจสอบหลักฐานเบื้องต้น",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotClass: "bg-sky-500",
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "กำลังประสานร้านค้า/ขนส่ง",
    customerDescription: "แอดมินกำลังรวบรวมข้อมูลและเจรจาติดตามเรื่องให้คุณอย่างเต็มที่",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  WAITING_CUSTOMER: {
    value: "WAITING_CUSTOMER",
    label: "รอข้อมูลเพิ่มเติมจากคุณ",
    customerDescription: "แอดมินขอหลักฐานหรือข้อมูลเพิ่มเติม กรุณาตอบกลับในหน้านี้",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    dotClass: "bg-orange-500",
  },
  RESOLVED: {
    value: "RESOLVED",
    label: "ประสานงานเสร็จสิ้น",
    customerDescription: "ได้ข้อสรุปและดำเนินการประสานงานเรียบร้อยแล้ว",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  CLOSED: {
    value: "CLOSED",
    label: "ปิดเคส",
    customerDescription: "เคสนี้ถูกปิดการติดตามแล้ว",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  },
}

export const COORDINATOR_SCOPE_NOTICE = {
  title: "บทบาทของ Sabuy Ship ในการช่วยประสานงาน",
  summary:
    "Sabuy Ship ไม่ได้เป็นผู้รับประกันหรือรับผิดชอบชดเชยกรณีสินค้าสูญหาย เสียหายระหว่างขนส่ง หรือสินค้าไม่ตรงปก แต่เราพร้อมทำหน้าที่เป็นตัวช่วยประสานงานอย่างเต็มที่ในการรวบรวมหลักฐาน ยื่นเรื่องเจรจากับร้านค้าจีน แพลตฟอร์ม และขนส่งให้คุณทุกเคส",
  highlights: [
    "ช่วยสื่อสารภาษาจีนและยื่นหลักฐานกับร้านค้า/แพลตฟอร์ม/ขนส่งอย่างเต็มความสามารถ",
    "ผลการคืนเงินหรือชดเชยขึ้นอยู่กับการพิจารณาของร้านค้าต้นทางหรือบริษัทขนส่ง",
    "หากร้านค้าหรือขนส่งอนุมัติคืนเงิน ทีมงานจะบันทึกคืนให้ลูกค้าเต็มจำนวนตามจริง",
  ],
  ackLabel:
    "รับทราบว่า Sabuy Ship ทำหน้าที่เป็นผู้ช่วยประสานงานอย่างเต็มที่ และไม่ได้รับผิดชอบชดเชยกรณีของหาย เสียหาย หรือสินค้าไม่ตรงปก",
} as const

export function isTicketCategory(value: unknown): value is TicketCategory {
  return typeof value === "string" && (TICKET_CATEGORIES as readonly string[]).includes(value)
}

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && (TICKET_STATUSES as readonly string[]).includes(value)
}

export function isTicketOpen(status: string | null | undefined): boolean {
  return status === "NEW" || status === "IN_PROGRESS" || status === "WAITING_CUSTOMER"
}

export function getTicketCategoryLabel(category: string | null | undefined): string {
  if (isTicketCategory(category)) return TICKET_CATEGORY_META[category].label
  return "ปัญหาอื่น ๆ"
}

export function getTicketStatusMeta(status: string | null | undefined): TicketStatusMeta {
  if (isTicketStatus(status)) return TICKET_STATUS_META[status]
  return TICKET_STATUS_META.NEW
}

export function generateTicketNumber(now = new Date()): string {
  const { key } = getBangkokDateParts(now)
  const yymmdd = key.slice(2).replace(/-/g, "")
  const bytes = new Uint8Array(2)
  globalThis.crypto.getRandomValues(bytes)
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
  return `TKT-${yymmdd}-${suffix}`
}

export function validateOptionalVideoUrl(raw: unknown): {
  ok: boolean
  url: string | null
  error?: string
} {
  if (raw === null || raw === undefined) return { ok: true, url: null }
  if (typeof raw !== "string") {
    return { ok: false, url: null, error: "รูปแบบลิงก์วิดีโอไม่ถูกต้อง" }
  }
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true, url: null }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, url: null, error: "ลิงก์วิดีโอต้องขึ้นต้นด้วย https:// หรือ http://" }
    }
    return { ok: true, url: parsed.toString() }
  } catch {
    return {
      ok: false,
      url: null,
      error: "กรุณาวางลิงก์วิดีโอที่ถูกต้อง (เช่น ลิงก์ Google Drive หรือ LINE Album/Note)",
    }
  }
}

export function sanitizeTicketAttachmentPaths(rawPaths: unknown, ownerUserId: string): string[] {
  if (!Array.isArray(rawPaths) || !ownerUserId) return []
  const cleaned = new Set<string>()

  for (const raw of rawPaths) {
    if (typeof raw !== "string") continue
    const path = extractStorageObjectPath(raw.trim(), TICKET_BUCKET_NAME)
    if (!path) continue
    if (path.includes("..") || !path.startsWith(`${ownerUserId}/`)) continue
    cleaned.add(path)
    if (cleaned.size >= MAX_TICKET_ATTACHMENTS) break
  }

  return Array.from(cleaned)
}

export interface SignedTicketAttachment {
  path: string
  signedUrl: string
}

export async function signTicketAttachmentUrls(
  adminClient: SupabaseClient,
  paths: string[],
  expiresInSeconds = 300
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(
    new Set(
      paths
        .map((p) => extractStorageObjectPath(p, TICKET_BUCKET_NAME))
        .filter((p): p is string => Boolean(p && !p.includes("..")))
    )
  )

  const urlMap = new Map<string, string>()
  if (uniquePaths.length === 0) return urlMap

  const { data, error } = await adminClient.storage
    .from(TICKET_BUCKET_NAME)
    .createSignedUrls(uniquePaths, expiresInSeconds)

  if (error || !data) {
    console.error("Failed to sign ticket attachment URLs:", error?.message)
    return urlMap
  }

  for (const item of data) {
    if (item.path && item.signedUrl) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return urlMap
}
