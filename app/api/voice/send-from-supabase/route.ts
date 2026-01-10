import { NextRequest, NextResponse } from "next/server"
import { sendVoicemail } from "@/lib/api/twilio"
import { getSupabaseMediaUrl } from "@/lib/api/supabase"

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

/**
 * Send voicemail using an existing media file from Supabase Storage
 * 
 * Request body:
 * {
 *   to: string,                    // Phone number to call (e.g., "+15551234567")
 *   filePath: string,               // Path to file in Supabase bucket (e.g., "myfile.mp3" or "folder/myfile.mp3")
 *   bucket?: string,                // Bucket name (default: "voice-messages")
 *   useSignedUrl?: boolean,         // Use signed URL for private buckets (default: false)
 *   from?: string,                  // Twilio phone number (optional, uses env var if not provided)
 *   callerId?: string,              // Caller ID to display (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, filePath, bucket, useSignedUrl, from, callerId } = body

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: "Phone number (to) is required" },
        { status: 400 }
      )
    }

    if (!filePath) {
      return NextResponse.json(
        { error: "File path (filePath) is required. This should be the path to your media file in Supabase Storage (e.g., 'myfile.mp3' or 'folder/myfile.mp3')" },
        { status: 400 }
      )
    }

    // Get the media URL from Supabase (public or signed)
    let audioUrl: string
    try {
      audioUrl = await getSupabaseMediaUrl(
        filePath,
        bucket || "voice-messages",
        useSignedUrl || false,
        600 // 10 minutes expiration for signed URLs
      )
      console.log("Retrieved Supabase media URL:", audioUrl)
    } catch (error: any) {
      console.error("Failed to get Supabase media URL:", error)
      return NextResponse.json(
        { 
          error: `Failed to get media URL from Supabase: ${error.message || "Please check your file path and bucket configuration."}`,
          hint: "Make sure the file exists in your Supabase Storage bucket. If using a private bucket, set useSignedUrl to true."
        },
        { status: 400 }
      )
    }

    // Send voicemail via Twilio using the Supabase URL
    const result = await sendVoicemail({
      to,
      from: from || TWILIO_PHONE_NUMBER,
      audioUrl,
      callerId,
    })

    return NextResponse.json({
      success: true,
      message: `Voicemail sent to ${to}`,
      callSid: result.callSid,
      status: result.status,
      audioUrl, // For debugging
      filePath, // Echo back the file path used
    })
  } catch (error: any) {
    console.error("Voicemail send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send voicemail" },
      { status: 500 }
    )
  }
}

