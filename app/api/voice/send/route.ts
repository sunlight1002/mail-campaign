import { NextRequest, NextResponse } from "next/server"
import { generateVoice } from "@/lib/api/elevenlabs"
import { sendVoicemail } from "@/lib/api/twilio"
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
    let audioUrl: string

    try {
      // Generate filename with prospect info for tracking
      const filename = `voicemail-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`
      audioUrl = await uploadAudioToSupabase(audioBuffer, filename)
      console.log("Audio uploaded to Supabase:", audioUrl)
    } catch (uploadError: any) {
      console.error("Failed to upload audio to Supabase:", uploadError)
      throw new Error(`Failed to upload audio file: ${uploadError.message || "Please check your Supabase configuration."}`)
    }

    // Send voicemail via Twilio using the Supabase URL
    const result = await sendVoicemail({
      to: prospect.phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      audioUrl,
    })

    return NextResponse.json({
      success: true,
      message: `Voicemail sent to ${prospect.firstName}`,
      callSid: result.callSid,
      status: result.status,
      audioUrl, // For debugging
    })
  } catch (error: any) {
    console.error("Voice send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send voicemail" },
      { status: 500 }
    )
  }
}
