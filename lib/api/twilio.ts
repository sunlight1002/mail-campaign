import twilio from "twilio"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+17179708756"

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn("Twilio credentials not configured")
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

export interface SendSMSOptions {
  to: string
  from?: string
  body: string
}

export interface SendVoicemailOptions {
  to: string
  from?: string
  audioUrl: string
  callerId?: string
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
 * Send voicemail using Twilio Call API
 * This makes a call and plays the audio when voicemail/answering machine is detected
 */
export async function sendVoicemail(options: SendVoicemailOptions) {
  if (!client) {
    throw new Error("Twilio client is not configured. Please check your credentials.")
  }

  const { to, from = TWILIO_PHONE_NUMBER, audioUrl, callerId } = options

  // Validate audioUrl format
  if (!audioUrl || (!audioUrl.startsWith("http://") && !audioUrl.startsWith("https://"))) {
    throw new Error("Invalid audioUrl: Must be a valid HTTP/HTTPS URL")
  }

  // Get the base URL for TwiML endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not configured. This is required for voicemail functionality. " +
      "Please set NEXT_PUBLIC_APP_URL to your publicly accessible HTTPS URL (e.g., https://yourdomain.com). " +
      "For local development, use a tool like ngrok to expose your local server (e.g., https://abc123.ngrok-free.app)."
    )
  }

  // Validate that the URL is publicly accessible (not localhost, but allow ngrok)
  const isLocalhost = (appUrl.includes("localhost") || 
                      appUrl.includes("127.0.0.1") || 
                      appUrl.includes("0.0.0.0")) &&
                      !appUrl.includes("ngrok") // Allow ngrok URLs even if they contain localhost
  const isHttps = appUrl.startsWith("https://")
  const isNgrok = appUrl.includes("ngrok")
  
  if (isLocalhost || !isHttps) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be a publicly accessible HTTPS URL. Current value: ${appUrl}. ` +
      "Twilio cannot access localhost URLs. For local development, use a tool like ngrok to expose your local server: " +
      "1. Install ngrok: npm install -g ngrok (or download from ngrok.com)\n" +
      "2. Run: ngrok http 3000\n" +
      "3. Set NEXT_PUBLIC_APP_URL to the ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app)"
    )
  }

  // Log ngrok usage for debugging
  if (isNgrok) {
    console.log("Using ngrok URL for local development:", appUrl)
  }

  // Construct the TwiML endpoint URL with the audio URL as a parameter
  const twimlUrl = `${appUrl}/api/twilio/voicemail-drop?audioUrl=${encodeURIComponent(audioUrl)}`

  try {
    // Create a call that will play the voicemail
    // machineDetection: "Enable" - detects if the call is answered by a machine
    // machineDetectionTimeout: 10 - wait up to 10 seconds for machine detection
    // If answered by a human, the call will still play the message
    const call = await client.calls.create({
      to,
      from: callerId || from,
      url: twimlUrl,
      machineDetection: "Enable",
      machineDetectionTimeout: 10,
      statusCallback: `${appUrl}/api/twilio/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: false,
    })

    console.log(`Voicemail call initiated - SID: ${call.sid}, Status: ${call.status}, To: ${to}`)

    return {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    }
  } catch (error: any) {
    console.error("Twilio voicemail API error:", error)
    
    // Provide helpful error messages
    if (error.message?.includes("trial")) {
      throw new Error("Twilio trial accounts may have limitations. Please upgrade your account or verify the recipient number.")
    }
    if (error.message?.includes("call")) {
      throw new Error(`Voicemail call failed: ${error.message}. Ensure the recipient number is valid and can receive calls.`)
    }
    
    throw new Error(`Failed to send voicemail: ${error.message}`)
  }
}
