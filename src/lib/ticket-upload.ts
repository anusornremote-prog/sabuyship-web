"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import { TICKET_BUCKET_NAME } from "@/lib/tickets"

/**
 * Compresses selected image files on the client and uploads them to the private
 * `ticket_attachments` bucket under `<userId>/<scopeId>/...`.
 */
export async function uploadTicketImages(
  supabase: SupabaseClient,
  userId: string,
  scopeId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return []
  const uploadedPaths: string[] = []

  let imageCompression: ((file: File, options: Record<string, unknown>) => Promise<Blob>) | null =
    null
  try {
    const mod = await import("browser-image-compression")
    imageCompression = mod.default as unknown as (
      file: File,
      options: Record<string, unknown>
    ) => Promise<Blob>
  } catch {
    imageCompression = null
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    let blobToUpload: Blob | File = file

    if (imageCompression) {
      try {
        const compressed = await Promise.race([
          imageCompression(file, {
            maxSizeMB: 0.35,
            maxWidthOrHeight: 1400,
            useWebWorker: false,
            fileType: "image/jpeg",
            initialQuality: 0.75,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Compression timeout")), 6000)
          ),
        ])
        if (compressed && compressed.size > 0) {
          blobToUpload = compressed
        }
      } catch {
        blobToUpload = file
      }
    }

    const uploadMime =
      blobToUpload.type &&
      ["image/jpeg", "image/png", "image/webp"].includes(blobToUpload.type)
        ? blobToUpload.type
        : "image/jpeg"
    const ext = uploadMime === "image/png" ? "png" : uploadMime === "image/webp" ? "webp" : "jpg"
    const safeScope = scopeId.replace(/[^a-zA-Z0-9_-]/g, "") || "general"
    const objectPath = `${userId}/${safeScope}/ticket-${Date.now()}-${i}.${ext}`

    const { data, error } = await supabase.storage
      .from(TICKET_BUCKET_NAME)
      .upload(objectPath, blobToUpload, {
        contentType: uploadMime,
        upsert: false,
      })

    if (error || !data?.path) {
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพที่ ${i + 1} ได้ กรุณาลองใหม่อีกครั้ง`)
    }

    uploadedPaths.push(data.path)
  }

  return uploadedPaths
}
