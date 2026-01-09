import { NextRequest, NextResponse } from "next/server"
import { sendMMS } from "@/lib/api/twilio"
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

    // If audioUrl is provided, use it directly
    if (audioUrl) {
      mediaUrl = audioUrl
      console.log("Using provided audio URL:", mediaUrl)
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
        const filename = `test-audio-${Date.now()}.mp3`
        mediaUrl = await uploadAudioToSupabase(audioBuffer, filename)
        console.log("Test audio uploaded to Supabase:", mediaUrl)
      } catch (uploadError: any) {
        console.error("Failed to upload test audio to Supabase:", uploadError)
        throw new Error(`Failed to upload audio file: ${uploadError.message || "Please check your Supabase configuration."}`)
      }
    }

    // Send MMS via Twilio using the media URL
    // Note: Twilio automatically adds "Sent from your Twilio trial account - " prefix for trial accounts
    const result = await sendMMS({
      to,
      from: TWILIO_PHONE_NUMBER,
      mediaUrl,
      body: "Test audio message from Campaign Manager", // Minimal body text - Twilio will add trial account prefix automatically
    })

    return NextResponse.json({
      success: true,
      message: `Test audio message sent to ${to}`,
      messageSid: result.messageSid,
      status: result.status,
      mediaUrl, // For debugging
    })
  } catch (error: any) {
    console.error("Test audio message error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send test audio message" },
      { status: 500 }
    )
  }
}

