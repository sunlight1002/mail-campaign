import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase credentials not configured")
}

// Create Supabase client with service role key for server-side operations
export const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

/**
 * Upload audio buffer to Supabase Storage and return public URL
 */
export async function uploadAudioToSupabase(
  audioBuffer: Buffer,
  filename?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please check your credentials.")
  }

  // Generate unique filename if not provided
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(7)
  const finalFilename = filename || `voice-${timestamp}-${randomStr}.mp3`

  try {
    // Upload to Supabase Storage bucket (create 'voice-messages' bucket if it doesn't exist)
    const { data, error } = await supabase.storage
      .from("voice-messages")
      .upload(finalFilename, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      // If bucket doesn't exist, provide helpful error message
      if (error.message.includes("Bucket") || error.message.includes("not found")) {
        throw new Error(
          `Storage bucket 'voice-messages' not found. Please create it in your Supabase dashboard:
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named "voice-messages"
3. Make it public (uncheck "Private bucket")
4. Try again`
        )
      }
      throw error
    }

    // Get public URL - ensure it's directly accessible
    const { data: urlData } = supabase.storage
      .from("voice-messages")
      .getPublicUrl(finalFilename)

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL from Supabase")
    }

    // Ensure the URL is HTTPS and directly accessible
    let publicUrl = urlData.publicUrl
    
    // Supabase public URLs should work, but let's verify it's properly formatted
    // The URL should be: https://[project].supabase.co/storage/v1/object/public/voice-messages/filename.mp3
    
    // Make sure the URL is accessible by testing it
    try {
      const testResponse = await fetch(publicUrl, { method: "HEAD" })
      if (!testResponse.ok) {
        throw new Error(`Media URL not accessible: ${testResponse.status}`)
      }
      
      // Verify content type
      const contentType = testResponse.headers.get("content-type")
      if (contentType && !contentType.includes("audio")) {
        console.warn(`Warning: Supabase URL returns content-type: ${contentType}, expected audio/mpeg`)
      }
    } catch (error: any) {
      console.warn("Could not verify Supabase URL accessibility:", error.message)
      // Continue anyway - Twilio will try to fetch it
    }

    return publicUrl
  } catch (error: any) {
    console.error("Supabase upload error:", error)
    throw new Error(`Failed to upload to Supabase: ${error.message || "Unknown error"}`)
  }
}

