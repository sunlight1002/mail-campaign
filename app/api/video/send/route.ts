import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

const BOMBBOMB_API_KEY = process.env.BOMBBOMB_API_KEY
const BOMBBOMB_USER_EMAIL = process.env.BOMBBOMB_USER_EMAIL
const BOMBBOMB_API_URL = "https://api.bombbomb.com/v2"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prospect, script, yourName, yourPhone } = body

    if (!prospect || !script || !prospect.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // BombBomb API integration
    // This is a placeholder - you'll need to implement based on BombBomb's actual API
    // Typically involves:
    // 1. Generating/uploading the video
    // 2. Creating an email template with the video
    // 3. Sending the email

    if (!BOMBBOMB_API_KEY || !BOMBBOMB_USER_EMAIL) {
      // Return success for development/testing
      return NextResponse.json({
        success: true,
        message: `Video email queued for ${prospect.firstName} (BombBomb not configured)`,
      })
    }

    // Example BombBomb API call structure
    // Step 1: Upload/create video (if not already done)
    // Step 2: Create email with video
    const emailData = {
      email: prospect.email,
      subject: `Follow-up on your property at ${prospect.propertyAddress}`,
      personalMessage: script,
      videoId: "your_video_id", // From video generation step
    }

    // This is pseudo-code - adjust based on actual BombBomb API
    const response = await axios.post(
      `${BOMBBOMB_API_URL}/emails/send`,
      emailData,
      {
        headers: {
          "Authorization": `Bearer ${BOMBBOMB_API_KEY}`,
          "Content-Type": "application/json",
        },
        auth: {
          username: BOMBBOMB_USER_EMAIL,
          password: BOMBBOMB_API_KEY,
        },
      }
    )

    // Log to CRM (Salesforce integration would go here)
    // await logToCRM({
    //   prospect,
    //   campaignType: "video_email",
    //   status: "sent",
    //   emailId: response.data.email_id,
    // })

    return NextResponse.json({
      success: true,
      message: `Video email sent to ${prospect.firstName}`,
      emailId: response.data?.email_id,
    })
  } catch (error: any) {
    console.error("Video send error:", error)
    
    // Return success for development if API not configured
    if (!BOMBBOMB_API_KEY) {
      return NextResponse.json({
        success: true,
        message: `Video email queued (BombBomb not configured)`,
      })
    }

    return NextResponse.json(
      { error: error.message || "Failed to send video email" },
      { status: 500 }
    )
  }
}

