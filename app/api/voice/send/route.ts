import { NextRequest, NextResponse } from "next/server"
import { generateVoice } from "@/lib/api/elevenlabs"
import { sendMMS } from "@/lib/api/twilio"
import { uploadAudioToSupabase } from "@/lib/api/supabase"

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prospect, script, yourName, yourPhone, voiceId } = body

    if (!prospect || !script || !prospect.phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields: prospect, script, and phone number are required" },
        { status: 400 }
      )
    }

    // Generate voice audio using ElevenLabs
    const audioBuffer = await generateVoice({
      text: script,
      voiceId,
    })

    // Upload audio to Supabase Storage
    let mediaUrl: string

    try {
      // Generate filename with prospect info for tracking
      const filename = `voice-${prospect.firstName}-${Date.now()}.mp3`
      mediaUrl = await uploadAudioToSupabase(audioBuffer, filename)
      console.log("Audio uploaded to Supabase:", mediaUrl)
    } catch (uploadError: any) {
      console.error("Failed to upload audio to Supabase:", uploadError)
      throw new Error(`Failed to upload audio file: ${uploadError.message || "Please check your Supabase configuration."}`)
    }

    // Send MMS via Twilio using the Supabase URL
    // Note: For MMS to work properly, the body should be minimal or empty
    // Some carriers convert to SMS if body text is too long
    // Note: Twilio automatically adds "Sent from your Twilio trial account - " prefix for trial accounts
    const messageBody = yourName 
      ? `Voicemail from ${yourName}`
      : "Voicemail from Campaign Manager"
    
    const result = await sendMMS({
      to: prospect.phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      mediaUrl,
      body: messageBody, // Minimal body text - Twilio will add trial account prefix automatically
    })

    return NextResponse.json({
      success: true,
      message: `Voicemail MMS sent to ${prospect.firstName}`,
      messageSid: result.messageSid,
      status: result.status,
      mediaUrl, // For debugging
    })
  } catch (error: any) {
    console.error("Voice send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send voicemail" },
      { status: 500 }
    )
  }
}
