import { NextRequest, NextResponse } from "next/server"

/**
 * Escape XML special characters to prevent injection
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * TwiML endpoint that plays voicemail audio
 * This endpoint is called by Twilio when a call is answered or voicemail is detected
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get audioUrl from query parameters first (Twilio passes it in the URL)
    const searchParams = request.nextUrl.searchParams
    let audioUrl = searchParams.get("audioUrl")

    // If not in query params, try form data
    if (!audioUrl) {
      const formData = await request.formData()
      audioUrl = formData.get("audioUrl") as string
    }

    if (!audioUrl) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Error: No audio URL provided</Say>
  <Hangup/>
</Response>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/xml",
          },
        }
      )
    }

    // Generate TwiML that plays the audio and hangs up
    // Escape the URL to prevent XML injection
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(audioUrl)}</Play>
  <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error: any) {
    console.error("TwiML generation error:", error)
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred while playing the voicemail</Say>
  <Hangup/>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    )
  }
}

/**
 * GET endpoint for TwiML (Twilio can use either GET or POST)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const audioUrl = searchParams.get("audioUrl")

    if (!audioUrl) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Error: No audio URL provided</Say>
  <Hangup/>
</Response>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/xml",
          },
        }
      )
    }

    // Generate TwiML that plays the audio and hangs up
    // Escape the URL to prevent XML injection
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(audioUrl)}</Play>
  <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error: any) {
    console.error("TwiML generation error:", error)
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred while playing the voicemail</Say>
  <Hangup/>
</Response>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    )
  }
}

