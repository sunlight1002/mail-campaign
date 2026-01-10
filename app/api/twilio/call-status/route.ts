import { NextRequest, NextResponse } from "next/server"

/**
 * Webhook endpoint for Twilio call status updates
 * This endpoint receives call status updates from Twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const to = formData.get("To") as string
    const from = formData.get("From") as string
    const answeredBy = formData.get("AnsweredBy") as string

    console.log("Call status update:", {
      callSid,
      callStatus,
      to,
      from,
      answeredBy,
    })

    // You can add additional logic here, such as:
    // - Storing call status in a database
    // - Sending notifications
    // - Logging analytics

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Call status webhook error:", error)
    return NextResponse.json(
      { error: "Failed to process call status" },
      { status: 500 }
    )
  }
}

