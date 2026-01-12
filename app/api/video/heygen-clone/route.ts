import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const HEYGEN_AVATAR_ID = process.env.HEYGEN_AVATAR_ID
const HEYGEN_VOICE_ID = process.env.HEYGEN_VOICE_ID
const HEYGEN_API_URL = "https://api.heygen.com/v2"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    if (!HEYGEN_API_KEY || !HEYGEN_AVATAR_ID || !HEYGEN_VOICE_ID) {
      return NextResponse.json(
        { error: "HeyGen configuration is incomplete. Please check environment variables." },
        { status: 500 }
      )
    }

    // Create video generation task using HeyGen API v2
    const response = await axios.post(
      `${HEYGEN_API_URL}/video/generate`,
      {
        caption: 'false',
        video_inputs: [
          {
            character: {
              type: 'talking_photo',
              scale: 1,
              avatar_style: 'normal',
              talking_style: 'stable',
              talking_photo_id: HEYGEN_AVATAR_ID
            },
            voice: {
              type: 'text',
              speed: '1',
              pitch: '0',
              duration: '1',
              voice_id: HEYGEN_VOICE_ID,
              input_text: text
            },
            background: {type: 'color', value: '#FFFFFF', play_style: 'freeze', fit: 'cover'},
            text: {type: 'text', text: '', line_height: '1.2'}
          }
        ],
        dimension: {width: 560, height: 720}
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": HEYGEN_API_KEY,
        },
      }
    )

    console.log("❤", response.data)

    const videoId = response.data?.data?.video_id;

    if (!videoId) {
      return NextResponse.json(
        { error: "Failed to create video generation task. No task ID returned." },
        { status: 500 }
      )
    }

    // Poll for video completion
    let videoUrl = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 second intervals)

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds

      try {
        // Check video status using v1 API
        const statusResponse = await axios.get(
          "https://api.heygen.com/v1/video_status.get",
          {
            params: { video_id: videoId },
            headers: {
              accept: "application/json",
              "x-api-key": HEYGEN_API_KEY,
            },
          }
        )

        // Response structure: { code: 100, data: {...}, message: "Success" }
        const responseData = statusResponse.data
        const statusData = responseData?.data
        
        if (!statusData) {
          attempts++
          continue
        }

        const status = statusData.status
        const videoUrlFromResponse = statusData.video_url

        if (status === "completed" && videoUrlFromResponse) {
          videoUrl = videoUrlFromResponse
          break
        } else if (status === "failed" || status === "error") {
          return NextResponse.json(
            { error: statusData.error || "Video generation failed" },
            { status: 500 }
          )
        } else if (status === "pending" || status === "processing") {
          // Continue polling
          attempts++
          continue
        }
      } catch (pollError: any) {
        // Continue polling if it's not a critical error
        console.error("Polling error:", pollError.message)
        // If it's a 404, the video might not be ready yet, continue polling
        if (pollError.response?.status === 404) {
          attempts++
          continue
        }
      }

      attempts++
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video generation timed out. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      videoId,
      message: "Video generated successfully",
    })
  } catch (error: any) {
    console.error("HeyGen video generation error:", error)
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error?.message || error.message || "Failed to generate video" 
      },
      { status: 500 }
    )
  }
}

