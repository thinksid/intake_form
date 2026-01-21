import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Parse file URLs from response object
 * Handles both new file_urls array and legacy file_url string
 */
export function parseFileUrls(response: any): string[] {
  if (!response) return []

  // Try new format first
  if (response.file_urls) {
    try {
      const parsed = JSON.parse(response.file_urls)
      return Array.isArray(parsed) ? parsed.filter((url: string) => url) : []
    } catch (error) {
      console.error('Failed to parse file_urls:', error)
      return []
    }
  }

  // Fallback to legacy format
  if (response.file_url) {
    return [response.file_url]
  }

  return []
}

/**
 * Get a display name for a file URL
 */
export function getFileDisplayName(url: string, index: number): string {
  if (url.includes('drive.google.com')) return 'Google Drive Folder'
  if (url.includes('dropbox.com')) return 'Dropbox Folder'

  // Try to extract filename from URL
  try {
    const pathname = new URL(url).pathname
    const filename = pathname.split('/').pop()
    if (filename && filename.length > 0) {
      return decodeURIComponent(filename)
    }
  } catch {
    // Invalid URL, use fallback
  }

  return `Attachment ${index + 1}`
}

/**
 * Validate file URLs array
 */
export function validateFileUrls(urls: unknown): urls is string[] {
  if (!Array.isArray(urls)) return false
  if (urls.length === 0) return false
  return urls.every(url => typeof url === 'string' && url.trim().length > 0)
}
