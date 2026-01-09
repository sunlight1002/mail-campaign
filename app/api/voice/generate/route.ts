import { NextRequest, NextResponse } from "next/server"
import { generateVoice } from "@/lib/api/elevenlabs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId } = body

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    const audioBuffer = await generateVoice({
      text,
      voiceId,
    })

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=voice.mp3",
      },
    })
  } catch (error: any) {
    console.error("Voice generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate voice" },
      { status: 500 }
    )
  }
}

