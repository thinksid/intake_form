import { NextRequest } from 'next/server'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'text/csv',
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    if (!sessionId) {
      return errorResponse('Session ID is required', 400)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File exceeds 50MB limit', 400)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('File type not allowed', 400)
    }

    // Generate unique file key
    const fileExt = file.name.split('.').pop()
    const fileKey = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileKey, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return errorResponse('Failed to upload file', 500)
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileKey)

    return successResponse({
      fileUrl: data.publicUrl,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
