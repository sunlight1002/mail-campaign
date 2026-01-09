import twilio from "twilio"
import FormData from "form-data"
import axios from "axios"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn("Twilio credentials not configured")
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

export interface SendMMSOptions {
  to: string
  from?: string
  mediaUrl: string
  body?: string
}

export interface SendSMSOptions {
  to: string
  from?: string
  body: string
}

/**
 * Send SMS message via Twilio (for testing)
 */
export async function sendSMS(options: SendSMSOptions) {
  if (!client) {
    throw new Error("Twilio client is not configured. Please check your credentials.")
  }

  const { to, from = TWILIO_PHONE_NUMBER, body } = options

  try {
    const message = await client.messages.create({
      to,
      from,
      body,
    })

    return {
      messageSid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
    }
  } catch (error: any) {
    console.error("Twilio SMS API error:", error)
    throw new Error(`Failed to send SMS: ${error.message}`)
  }
}

/**
 * Send MMS message with audio file via Twilio
 * The audio will be embedded and playable directly in the message
 */
export async function sendMMS(options: SendMMSOptions) {
  if (!client) {
    throw new Error("Twilio client is not configured. Please check your credentials.")
  }

  const { to, from = TWILIO_PHONE_NUMBER, mediaUrl, body } = options

  // Validate mediaUrl format
  if (!mediaUrl || (!mediaUrl.startsWith("http://") && !mediaUrl.startsWith("https://"))) {
    throw new Error("Invalid mediaUrl: Must be a valid HTTP/HTTPS URL")
  }

  // Verify the URL is accessible and returns audio content
  try {
    const testResponse = await axios.head(mediaUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    })
    
    const contentType = testResponse.headers["content-type"] || ""
    if (!contentType.includes("audio") && !contentType.includes("mpeg") && !contentType.includes("mp3")) {
      console.warn(`Warning: Media URL content-type is ${contentType}, expected audio/mpeg`)
    }
  } catch (error: any) {
    console.warn("Could not verify media URL accessibility:", error.message)
    // Continue anyway - Twilio will handle the error
  }

  try {
    // Send MMS - ensure it's sent as MMS by including mediaUrl
    // For MMS to work properly:
    // 1. The mediaUrl must be publicly accessible
    // 2. The file must return proper Content-Type headers
    // 3. The phone number must support MMS
    
    // Only set statusCallback if we have a valid public URL (not localhost)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const hasValidCallbackUrl = appUrl && 
      !appUrl.includes("localhost") && 
      !appUrl.includes("127.0.0.1") &&
      (appUrl.startsWith("https://") || appUrl.startsWith("http://"))
    
    const messageOptions: any = {
      to,
      from,
      // Don't include body text if you want only audio, or keep it minimal
      // Some carriers convert to SMS if body is too long
      body: body || "", // Empty body or minimal text for MMS
      mediaUrl: [mediaUrl], // Array of media URLs
    }
    
    // Only add statusCallback if we have a valid public URL
    if (hasValidCallbackUrl) {
      messageOptions.statusCallback = `${appUrl}/api/webhooks/twilio`
    }
    
    const message = await client.messages.create(messageOptions)

    console.log(`MMS sent - SID: ${message.sid}, Status: ${message.status}, NumMedia: ${message.numMedia || 0}`)

    return {
      messageSid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      numMedia: message.numMedia || 0,
    }
  } catch (error: any) {
    console.error("Twilio MMS API error:", error)
    
    // Provide helpful error messages
    if (error.message?.includes("trial")) {
      throw new Error("Twilio trial accounts may have limitations. Please upgrade your account or verify the recipient number.")
    }
    if (error.message?.includes("MMS") || error.message?.includes("media")) {
      throw new Error(`MMS sending failed: ${error.message}. Ensure the media URL is publicly accessible and the recipient number supports MMS.`)
    }
    
    throw new Error(`Failed to send MMS: ${error.message}`)
  }
}

/**
 * Upload audio buffer to a publicly accessible URL using file.io
 * This is a temporary solution for development
 * For production, use S3, Cloudinary, or similar
 */
export async function uploadAudioToPublicStorage(audioBuffer: Buffer): Promise<string> {
  try {
    // Use file.io for temporary file hosting (free, public URLs)
    const formData = new FormData()
    formData.append("file", audioBuffer, {
      filename: "voice.mp3",
      contentType: "audio/mpeg",
    })

    const response = await axios.post("https://file.io", formData, {
      headers: formData.getHeaders(),
    })

    if (response.data.success && response.data.link) {
      return response.data.link
    } else {
      throw new Error("Failed to upload to file.io")
    }
  } catch (error: any) {
    console.error("File upload error:", error.response?.data || error.message)
    
    // Fallback: Try transfer.sh
    try {
      const formData2 = new FormData()
      formData2.append("file", audioBuffer, {
        filename: "voice.mp3",
        contentType: "audio/mpeg",
      })

      const transferResponse = await axios.post(
        "https://transfer.sh/voice.mp3",
        audioBuffer,
        {
          headers: {
            "Content-Type": "audio/mpeg",
          },
        }
      )

      if (transferResponse.data) {
        // transfer.sh returns the URL in the response body
        return transferResponse.data.trim()
      }
    } catch (transferError: any) {
      console.error("Transfer.sh upload error:", transferError)
    }

    throw new Error(`Failed to upload audio file: ${error.message}`)
  }
}

/**
 * Alternative: Upload to a temporary public storage and return URL
 * This is a simpler approach for development
 */
export async function getPublicMediaUrl(audioBuffer: Buffer): Promise<string> {
  // For production, you should upload to S3, Cloudinary, or similar
  // For now, we'll create a temporary endpoint or use a service
  
  // Option 1: Use a temporary file hosting service
  // Option 2: Create an API endpoint that serves the file temporarily
  // Option 3: Use Twilio's built-in media storage (requires different approach)
  
  // For now, let's create a simple solution using a data URL approach
  // But Twilio doesn't support data URLs, so we need a public URL
  
  // Best approach: Upload to a public storage service
  // For development, we can use a service like file.io, transfer.sh, or create our own endpoint
  
  throw new Error("Public media URL generation not implemented. Please configure a storage service.")
}

export interface RinglessVoicemailOptions {
  to: string
  from: string
  audioUrl: string
  callerId?: string
}

export async function sendRinglessVoicemail(options: RinglessVoicemailOptions) {
  if (!client) {
    throw new Error("Twilio client is not configured. Please check your credentials.")
  }

  const { to, from, audioUrl, callerId } = options

  try {
    const call = await client.calls.create({
      to,
      from: callerId || from,
      url: audioUrl, // TwiML URL that plays the voicemail
      machineDetection: "Enable",
      machineDetectionTimeout: 5,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    })

    return {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    }
  } catch (error: any) {
    console.error("Twilio API error:", error)
    throw new Error(`Failed to send voicemail: ${error.message}`)
  }
}

export async function createTwiMLForVoicemail(audioUrl: string): Promise<string> {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="2"/>
  <Hangup/>
</Response>`
}

