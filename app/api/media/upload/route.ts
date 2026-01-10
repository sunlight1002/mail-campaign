import { NextRequest, NextResponse } from "next/server"
import { uploadFileToSupabase } from "@/lib/api/supabase"

// This endpoint stores media files in Supabase Storage and returns public URLs
// Works in both local and serverless environments

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "No file data provided" },
        { status: 400 }
      )
    }

    // Get file extension from original filename
    const originalName = file.name
    const extension = originalName.split(".").pop() || "mp3"
    
    // Generate unique filename preserving extension
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `media-${timestamp}-${randomStr}.${extension}`

    // Upload to Supabase Storage
    const contentType = file.type || undefined
    const publicUrl = await uploadFileToSupabase(
      buffer,
      filename,
      "media", // Use "media" bucket for general media uploads
      contentType
    )

    return NextResponse.json({
      url: publicUrl,
      filename,
    })
  } catch (error: any) {
    console.error("Media upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload media" },
      { status: 500 }
    )
  }
}

