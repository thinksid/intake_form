'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  sessionId: string
  currentFileUrl: string | null
  onFileChange: (fileUrl: string | null) => void
}

export default function FileUpload({ sessionId, currentFileUrl, onFileChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(
    currentFileUrl ? { name: 'Uploaded file', url: currentFileUrl } : null
  )
  const [folderUrl, setFolderUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds 50MB limit')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', sessionId)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Upload failed')
      }

      const { data } = await res.json()

      setUploadedFile({ name: data.fileName, url: data.fileUrl })
      onFileChange(data.fileUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    onFileChange(null)
  }

  const handleFolderUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFolderUrl(url)
    if (url) {
      onFileChange(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Upload a File</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-center gap-3">
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {uploadedFile.name}
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                Click to select or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, PNG, JPG (max 50MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.csv"
              />
            </label>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Folder URL */}
      <div>
        <Label htmlFor="folderUrl" className="text-sm font-medium mb-2 block">
          Share a Folder Link
        </Label>
        <Input
          id="folderUrl"
          type="url"
          placeholder="https://drive.google.com/... or https://dropbox.com/..."
          value={folderUrl}
          onChange={handleFolderUrlChange}
        />
        <p className="text-xs text-gray-500 mt-1">
          Paste a link to Dropbox, Google Drive, or other shared folder
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
