'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, ExternalLink, Loader2, AlertCircle, Plus } from 'lucide-react'
import { FileAttachment } from '@/types'

interface FileUploadProps {
  sessionId: string
  currentFileUrls: string[] | null
  onFileChange: (fileUrls: string[] | null) => void
}

export default function FileUpload({ sessionId, currentFileUrls, onFileChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>(() => {
    if (currentFileUrls && currentFileUrls.length > 0) {
      return currentFileUrls.map((url, idx) => ({
        name: url.includes('drive.google.com') || url.includes('dropbox.com')
          ? 'Shared Folder'
          : `File ${idx + 1}`,
        url,
      }))
    }
    return []
  })
  const [folderUrl, setFolderUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 10

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file limit
    if (uploadedFiles.length >= MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

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

      const newFile: FileAttachment = {
        name: data.fileName,
        url: data.fileUrl
      }

      const newFiles = [...uploadedFiles, newFile]
      setUploadedFiles(newFiles)
      onFileChange(newFiles.map(f => f.url))

      // Clear folder URL if files are uploaded
      setFolderUrl('')
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (indexToRemove: number) => {
    const newFiles = uploadedFiles.filter((_, idx) => idx !== indexToRemove)
    setUploadedFiles(newFiles)
    onFileChange(newFiles.length > 0 ? newFiles.map(f => f.url) : null)
  }

  const handleFolderUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFolderUrl(url)

    if (url.trim()) {
      // Clear uploaded files when folder URL is provided
      setUploadedFiles([])
      onFileChange([url])
    } else {
      onFileChange(null)
    }
  }

  const handleFolderUrlBlur = () => {
    if (folderUrl.trim() && !folderUrl.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://')
    } else {
      setError('')
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Upload Files</Label>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2 flex-1 min-w-0"
                >
                  <span className="truncate">{file.name}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(idx)}
                  className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area or Add Another File Button */}
        {uploadedFiles.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, XLS, PNG, JPG (max 50MB each)
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
        ) : (
          <div>
            {uploading ? (
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : uploadedFiles.length < MAX_FILES ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another File ({uploadedFiles.length}/{MAX_FILES})
              </Button>
            ) : (
              <p className="text-sm text-gray-500 text-center p-2">
                Maximum {MAX_FILES} files reached
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.csv"
            />
          </div>
        )}
      </div>

      {/* Divider - Only show if no folder URL and no uploaded files */}
      {!folderUrl && uploadedFiles.length === 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>
      )}

      {/* Folder URL - Only show if no uploaded files */}
      {uploadedFiles.length === 0 && (
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
            onBlur={handleFolderUrlBlur}
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste a link to Dropbox, Google Drive, or other shared folder
          </p>
        </div>
      )}

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
