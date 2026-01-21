'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, FileText, ExternalLink } from 'lucide-react'
import { formatDateTime, parseFileUrls, getFileDisplayName } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  question_type: string
  is_required: boolean
  display_order: number
}

interface Response {
  id: string
  question_id: string
  response_text: string | null
  file_url: string | null
  file_urls: string | null  // JSON string
  created_at: string | Date | null
  question: Question
}

interface Questionnaire {
  id: string
  title: string
  client_name: string
  status: string
  completed_at: string | Date | null
  questions: Question[]
  responses: Response[]
}

export default function ResponseViewer({ questionnaire }: { questionnaire: Questionnaire }) {
  const router = useRouter()

  // Create a map of responses by question ID
  const responseMap = new Map(questionnaire.responses.map(r => [r.question_id, r]))

  const exportMarkdown = () => {
    let md = `# ${questionnaire.title}\n\n`
    md += `**Client:** ${questionnaire.client_name}\n`
    md += `**Completed:** ${formatDateTime(questionnaire.completed_at)}\n\n`
    md += `---\n\n`

    questionnaire.questions.forEach((q, index) => {
      const response = responseMap.get(q.id)
      md += `## Q${index + 1}: ${q.question_text}\n\n`

      if (response?.response_text) {
        md += `${response.response_text}\n\n`
      } else {
        const fileUrls = parseFileUrls(response)
        if (fileUrls.length > 0) {
          fileUrls.forEach((url, idx) => {
            md += `[${getFileDisplayName(url, idx + 1)}](${url})\n`
          })
          md += `\n`
        } else {
          md += `*No response*\n\n`
        }
      }
    })

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${questionnaire.title.replace(/\s+/g, '_')}_responses.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const headers = ['Question', 'Type', 'Required', 'Response', 'File URLs']
    const rows = questionnaire.questions.map(q => {
      const response = responseMap.get(q.id)
      const fileUrls = parseFileUrls(response)
      return [
        `"${q.question_text.replace(/"/g, '""')}"`,
        q.question_type,
        q.is_required ? 'Yes' : 'No',
        `"${(response?.response_text || '').replace(/"/g, '""')}"`,
        fileUrls.join(' | '),  // Multiple URLs separated by pipe
      ]
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${questionnaire.title.replace(/\s+/g, '_')}_responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Responses</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportMarkdown}>
              <FileText className="w-4 h-4 mr-1" />
              Markdown
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{questionnaire.title}</h2>
                <p className="text-sm text-gray-600">Client: {questionnaire.client_name}</p>
              </div>
              <div className="text-sm text-gray-500">
                Completed {formatDateTime(questionnaire.completed_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questionnaire.questions.map((q, index) => {
            const response = responseMap.get(q.id)

            return (
              <Card key={q.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium">
                      <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                      {q.question_text}
                    </CardTitle>
                    <div className="flex gap-1">
                      {q.is_required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">{q.question_type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {response?.response_text ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{response.response_text}</p>
                  ) : parseFileUrls(response).length > 0 ? (
                    <div className="space-y-1">
                      {parseFileUrls(response).map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline block text-sm"
                        >
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {getFileDisplayName(url, idx + 1)}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No response provided</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
