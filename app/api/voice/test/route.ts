import { NextRequest, NextResponse } from "next/server"
import { sendSMS } from "@/lib/api/twilio"

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    if (!to) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    // Send a test SMS message (not MMS) for testing Twilio connection
    // This doesn't require voice generation or audio files
    // Note: Twilio automatically adds "Sent from your Twilio trial account - " prefix for trial accounts
    const defaultMessage = message || "Test message from Campaign Manager. Twilio integration is working!"
    const result = await sendSMS({
      to,
      from: TWILIO_PHONE_NUMBER,
      body: defaultMessage,
    })

    return NextResponse.json({
      success: true,
      message: `Test message sent to ${to}`,
      messageSid: result.messageSid,
      status: result.status,
    })
  } catch (error: any) {
    console.error("Test message error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send test message" },
      { status: 500 }
    )
  }
}

