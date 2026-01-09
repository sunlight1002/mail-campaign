import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// This endpoint temporarily stores audio files and serves them publicly
// In production, use a proper storage service like S3, Cloudinary, etc.

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

    // Create public directory if it doesn't exist
    const publicDir = join(process.cwd(), "public", "temp-media")
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }

    // Get file extension from original filename
    const originalName = file.name
    const extension = originalName.split(".").pop() || "mp3"
    
    // Generate unique filename preserving extension
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `media-${timestamp}-${randomStr}.${extension}`
    const filepath = join(publicDir, filename)

    // Save file
    await writeFile(filepath, buffer)

    // Return public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const publicUrl = `${baseUrl}/temp-media/${filename}`

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

