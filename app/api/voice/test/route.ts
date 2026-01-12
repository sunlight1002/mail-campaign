import { NextRequest, NextResponse } from "next/server"
import { sendVoicemail } from "@/lib/api/twilio"

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, audioUrl } = body

    if (!phoneNumber || !audioUrl) {
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber and audioUrl are required" },
        { status: 400 }
      )
    }

    // Validate phone number format (basic check)
    if (!phoneNumber.startsWith("+")) {
      return NextResponse.json(
        { error: "Phone number must be in E.164 format (e.g., +1234567890)" },
        { status: 400 }
      )
    }

    // Validate audioUrl format
    if (!audioUrl.startsWith("http://") && !audioUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid audioUrl: Must be a valid HTTP/HTTPS URL" },
        { status: 400 }
      )
    }

    // Send voicemail via Twilio using the provided audio URL
    const result = await sendVoicemail({
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
      audioUrl,
    })

    return NextResponse.json({
      success: true,
      message: `Test voicemail sent to ${phoneNumber}`,
      callSid: result.callSid,
      status: result.status,
      audioUrl, // For debugging
    })
  } catch (error: any) {
    console.error("Test voicemail error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send test voicemail" },
      { status: 500 }
    )
  }
}


