import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (full permissions for storage)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || 'intake-uploads'

export async function uploadFile(
  file: File,
  sessionId: string
): Promise<{ fileUrl: string; fileKey: string }> {
  const fileExt = file.name.split('.').pop()
  const fileKey = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileKey, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileKey)

  return { fileUrl: data.publicUrl, fileKey }
}

export async function deleteFile(fileKey: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([fileKey])

  if (error) throw error
}
