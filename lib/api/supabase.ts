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

/**
 * Upload any file buffer to Supabase Storage and return public URL
 * @param fileBuffer - Buffer containing the file data
 * @param filename - Filename with extension (e.g., "media-123.mp3")
 * @param bucket - Bucket name (default: "media")
 * @param contentType - MIME type of the file (default: inferred from extension)
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToSupabase(
  fileBuffer: Buffer,
  filename: string,
  bucket: string = "media",
  contentType?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please check your credentials.")
  }

  // Infer content type from extension if not provided
  if (!contentType) {
    const extension = filename.split(".").pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    }
    contentType = contentTypes[extension || ""] || "application/octet-stream"
  }

  try {
    // Upload to Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, fileBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      // If bucket doesn't exist, provide helpful error message
      if (error.message.includes("Bucket") || error.message.includes("not found")) {
        throw new Error(
          `Storage bucket '${bucket}' not found. Please create it in your Supabase dashboard:
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named "${bucket}"
3. Make it public (uncheck "Private bucket")
4. Try again`
        )
      }
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename)

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL from Supabase")
    }

    return urlData.publicUrl
  } catch (error: any) {
    console.error("Supabase upload error:", error)
    throw new Error(`Failed to upload to Supabase: ${error.message || "Unknown error"}`)
  }
}

/**
 * Get public or signed URL for an existing file in Supabase Storage
 * @param filePath - Path to the file in the bucket (e.g., "myfile.mp3" or "folder/myfile.mp3")
 * @param bucket - Bucket name (default: "voice-messages")
 * @param useSignedUrl - Whether to use signed URL (for private buckets). Default: false (uses public URL)
 * @param expiresIn - Expiration time in seconds for signed URLs (default: 600 = 10 minutes)
 * @returns Public or signed URL that Twilio can access
 */
export async function getSupabaseMediaUrl(
  filePath: string,
  bucket: string = "voice-messages",
  useSignedUrl: boolean = false,
  expiresIn: number = 600
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Please check your credentials.")
  }

  try {
    let mediaUrl: string

    if (useSignedUrl) {
      // For private buckets, create a signed URL
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`)
      }

      if (!data?.signedUrl) {
        throw new Error("Failed to get signed URL from Supabase")
      }

      mediaUrl = data.signedUrl
    } else {
      // For public buckets, get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (!data?.publicUrl) {
        throw new Error("Failed to get public URL from Supabase")
      }

      mediaUrl = data.publicUrl

      // Verify the file exists and is accessible
      try {
        const testResponse = await fetch(mediaUrl, { method: "HEAD" })
        if (!testResponse.ok) {
          // If public URL fails, try signed URL as fallback
          console.warn(`Public URL not accessible (${testResponse.status}), trying signed URL...`)
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn)
          
          if (signedError || !signedData?.signedUrl) {
            throw new Error(`Media file not accessible. Public URL returned ${testResponse.status}`)
          }
          
          mediaUrl = signedData.signedUrl
        }
      } catch (error: any) {
        // If HEAD request fails, try signed URL as fallback
        if (!useSignedUrl) {
          console.warn("Public URL verification failed, trying signed URL...", error.message)
          try {
            const { data: signedData, error: signedError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, expiresIn)
            
            if (!signedError && signedData?.signedUrl) {
              mediaUrl = signedData.signedUrl
            } else {
              throw error // Re-throw original error
            }
          } catch {
            throw error // Re-throw original error
          }
        } else {
          throw error
        }
      }
    }

    // Ensure URL is HTTPS (required by Twilio)
    if (!mediaUrl.startsWith("https://")) {
      throw new Error(`Media URL must be HTTPS. Got: ${mediaUrl}`)
    }

    return mediaUrl
  } catch (error: any) {
    console.error("Supabase media URL error:", error)
    throw new Error(`Failed to get media URL from Supabase: ${error.message || "Unknown error"}`)
  }
}

