import axios from "axios"

const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || "https://api.elevenlabs.io/v1"
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_DEFAULT_VOICE_ID || "2kz7I2qp93JeVv97SMdi"
const DEFAULT_MODEL = process.env.ELEVENLABS_DEFAULT_MODEL || "eleven_multilingual_v2"

export interface VoiceGenerationOptions {
  text: string
  voiceId?: string
  model?: string
  stability?: number
  similarityBoost?: number
}

export async function generateVoice(options: VoiceGenerationOptions): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    model = DEFAULT_MODEL,
    stability = 0.5,
    similarityBoost = 0.75,
  } = options

  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      },
      {
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      }
    )

    return Buffer.from(response.data)
  } catch (error: any) {
    console.error("ElevenLabs API error:", error.response?.data || error.message)
    throw new Error(`Failed to generate voice: ${error.response?.data?.detail?.message || error.message}`)
  }
}

export async function getVoices() {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    })

    return response.data.voices
  } catch (error: any) {
    console.error("ElevenLabs API error:", error.response?.data || error.message)
    throw new Error(`Failed to fetch voices: ${error.response?.data?.detail?.message || error.message}`)
  }
}

