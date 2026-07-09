import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check if user is authenticated and is admin (optional but recommended)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (assuming profile role)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // 2. Query inquiries that are older than 90 days, have status QUOTED or REJECTED, and have image_url
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: oldInquiries, error: fetchError } = await supabase
      .from("inquiries")
      .select("id, image_url")
      .in("status", ["QUOTED", "REJECTED"])
      .not("image_url", "is", null)
      .lt("created_at", ninetyDaysAgo.toISOString())

    if (fetchError) throw fetchError

    if (!oldInquiries || oldInquiries.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No old images found to clean up." })
    }

    let deletedCount = 0;
    
    // 3. For each inquiry, delete the file from storage and update image_url to null
    for (const inq of oldInquiries) {
      if (inq.image_url) {
        // Extract filename from public URL
        // Example: https://xxxx.supabase.co/storage/v1/object/public/inquiries/1612345678-0.jpg
        const urlParts = inq.image_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        if (fileName) {
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from("inquiries")
            .remove([fileName])
            
          if (storageError) {
            console.error(`Failed to delete file ${fileName} for inquiry ${inq.id}:`, storageError)
            continue // Skip updating db if file deletion failed
          }
        }
        
        // Update DB
        const { error: dbError } = await supabase
          .from("inquiries")
          .update({ image_url: null })
          .eq("id", inq.id)
          
        if (dbError) {
          console.error(`Failed to update inquiry ${inq.id} image_url to null:`, dbError)
        } else {
          deletedCount++
        }
      }
    }

    return NextResponse.json({ success: true, count: deletedCount, totalFound: oldInquiries.length }, { status: 200 })
  } catch (error: any) {
    console.error("Cleanup API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
