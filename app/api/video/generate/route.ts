import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const HEYGEN_API_URL = "https://api.heygen.com/v1"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, prospect } = body

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    if (!HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "HeyGen API key is not configured" },
        { status: 500 }
      )
    }

    // HeyGen API integration
    // This is a placeholder - you'll need to implement based on HeyGen's actual API
    // Typically involves:
    // 1. Creating a video generation task
    // 2. Polling for completion
    // 3. Returning the video URL or file

    // Example structure (adjust based on actual HeyGen API):
    const response = await axios.post(
      `${HEYGEN_API_URL}/video/generate`,
      {
        text,
        avatar_id: "your_avatar_id", // Your cloned avatar ID
        voice_id: "your_voice_id",
      },
      {
        headers: {
          "X-Api-Key": HEYGEN_API_KEY,
          "Content-Type": "application/json",
        },
      }
    )

    // In production, you'd poll for the video to be ready
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      videoUrl: response.data.video_url || "https://example.com/video.mp4",
      message: "Video generation initiated",
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    
    // Return a mock response for development
    if (!HEYGEN_API_KEY) {
      return NextResponse.json({
        success: true,
        videoUrl: "https://example.com/mock-video.mp4",
        message: "Mock video (HeyGen API key not configured)",
      })
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    )
  }
}

