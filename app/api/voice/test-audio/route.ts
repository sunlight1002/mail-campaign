import { NextRequest, NextResponse } from "next/server"
import { sendVoicemail } from "@/lib/api/twilio"
import { uploadAudioToSupabase } from "@/lib/api/supabase"
import { readFile } from "fs/promises"
import { join } from "path"

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, audioUrl } = body

    if (!to) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    let mediaUrl: string

    // If audioUrl is provided, check if it's a localhost URL
    if (audioUrl) {
      // Check if the URL is localhost (Twilio cannot access localhost URLs)
      const isLocalhost = audioUrl.includes("localhost") || 
                         audioUrl.includes("127.0.0.1") || 
                         audioUrl.startsWith("/")
      
      if (isLocalhost) {
        console.log("Detected localhost URL, uploading to Supabase:", audioUrl)
        
        // Extract file path from URL
        // Format: http://localhost:3000/temp-media/filename.mp3 -> public/temp-media/filename.mp3
        let filePath: string
        try {
          const url = new URL(audioUrl)
          // Remove leading slash and map to public directory
          const relativePath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname
          filePath = join(process.cwd(), "public", relativePath)
        } catch {
          // If URL parsing fails, assume it's a relative path
          const relativePath = audioUrl.startsWith("/") ? audioUrl.slice(1) : audioUrl
          filePath = join(process.cwd(), "public", relativePath)
        }
        
        // Read the file from disk
        let audioBuffer: Buffer
        try {
          audioBuffer = await readFile(filePath)
        } catch (error: any) {
          return NextResponse.json(
            { error: `Failed to read audio file from ${filePath}: ${error.message}` },
            { status: 404 }
          )
        }
        
        // Upload to Supabase to get a publicly accessible URL
        try {
          const filename = `test-voicemail-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`
          mediaUrl = await uploadAudioToSupabase(audioBuffer, filename)
          console.log("Localhost audio uploaded to Supabase:", mediaUrl)
        } catch (uploadError: any) {
          console.error("Failed to upload localhost audio to Supabase:", uploadError)
          throw new Error(`Failed to upload audio file: ${uploadError.message || "Please check your Supabase configuration."}`)
        }
      } else {
        // URL is publicly accessible, use it directly
        mediaUrl = audioUrl
        console.log("Using provided public audio URL:", mediaUrl)
      }
    } else {
      // Fallback to test1.mp3 file from the project root
      let audioBuffer: Buffer
      try {
        const filePath = join(process.cwd(), "test1.mp3")
        audioBuffer = await readFile(filePath)
      } catch (error: any) {
        return NextResponse.json(
          { error: `No audio file provided and failed to read test1.mp3 file: ${error.message}. Please upload an audio file or ensure test1.mp3 exists in the project root.` },
          { status: 404 }
        )
      }

      // Upload audio to Supabase Storage
      try {
        const filename = `test-voicemail-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`
        mediaUrl = await uploadAudioToSupabase(audioBuffer, filename)
        console.log("Test audio uploaded to Supabase:", mediaUrl)
      } catch (uploadError: any) {
        console.error("Failed to upload test audio to Supabase:", uploadError)
        throw new Error(`Failed to upload audio file: ${uploadError.message || "Please check your Supabase configuration."}`)
      }
    }

    // Send voicemail via Twilio using the media URL
    const result = await sendVoicemail({
      to,
      from: TWILIO_PHONE_NUMBER,
      audioUrl: mediaUrl,
    })

    return NextResponse.json({
      success: true,
      message: `Test voicemail sent to ${to}`,
      callSid: result.callSid,
      status: result.status,
      audioUrl: mediaUrl, // For debugging
    })
  } catch (error: any) {
    console.error("Test voicemail error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send test voicemail" },
      { status: 500 }
    )
  }
}
