'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { CreateQuestionInput } from '@/types'

interface CSVQuestionImportProps {
  onImport: (questions: CreateQuestionInput[]) => void
}

interface CSVRow {
  question_text: string
}

export default function CSVQuestionImport({ onImport }: CSVQuestionImportProps) {
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CreateQuestionInput[] | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_QUESTIONS = 200
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const downloadTemplate = () => {
    const csv = `question_text
What is your primary business objective?
Describe your current challenges or pain points
What is your target timeline for this project?`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = `questionnaire_template_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  const parseCSV = (file: File): Promise<CreateQuestionInput[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          // Validate header
          if (!results.meta.fields?.includes('question_text')) {
            reject(new Error('CSV must have a "question_text" header in the first row.'))
            return
          }

          // Transform to Question objects
          const questions = results.data
            .map((row, idx) => ({
              text: row.question_text?.trim(),
              rowNumber: idx + 2, // +2 because: +1 for 1-based index, +1 for header row
            }))
            .filter((item) => item.text && item.text.length > 0)
            .map((item) => ({
              question_text: item.text!,
              question_type: 'OPEN_ENDED' as const,
              is_required: true,
            }))

          if (questions.length === 0) {
            reject(new Error('No valid questions found in CSV. Each row must have text in the question_text column.'))
            return
          }

          if (questions.length > MAX_QUESTIONS) {
            reject(new Error(`CSV contains too many questions (max ${MAX_QUESTIONS}). Please split into smaller files.`))
            return
          }

          resolve(questions)
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        },
      })
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Invalid file format. Please upload a CSV file.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum file size is 5MB.')
      return
    }

    // Validate not empty
    if (file.size === 0) {
      setError('CSV file is empty or cannot be read.')
      return
    }

    try {
      const questions = await parseCSV(file)
      setPreview(questions)
      setShowPreviewModal(true)
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file.')
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleConfirmImport = () => {
    if (preview) {
      onImport(preview)
      setShowPreviewModal(false)
      setPreview(null)
      setError(null)
    }
  }

  const handleCancelImport = () => {
    setShowPreviewModal(false)
    setPreview(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Questions (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file to quickly add multiple questions at once.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import from CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <p className="text-xs text-gray-500">
            CSV format: Single column with header "question_text". Questions will be added as Open Ended and Required by default.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Import Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Preview Imported Questions
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Found {preview?.length} question{preview?.length === 1 ? '' : 's'} in CSV
              </p>
              <p className="text-xs text-blue-700 mt-1">
                All questions will be set to: <strong>Type: Open Ended</strong>, <strong>Required: Yes</strong>
              </p>
              <p className="text-xs text-blue-700">
                You can edit these settings after import.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Questions to import:</p>
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {preview?.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 p-2 bg-white rounded border border-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-500 flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-sm text-gray-900">{q.question_text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button type="button" variant="outline" onClick={handleCancelImport}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmImport}>
              Import {preview?.length} Question{preview?.length === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
