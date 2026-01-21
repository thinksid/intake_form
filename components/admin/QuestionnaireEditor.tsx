'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, GripVertical, Copy, ExternalLink } from 'lucide-react'

interface Question {
  id?: string
  question_text: string
  question_type: 'OPEN_ENDED' | 'SHORT_ANSWER' | 'FILE_UPLOAD'
  is_required: boolean
}

interface Questionnaire {
  id: string
  session_id: string
  title: string
  client_name: string
  questions: Question[]
}

export default function QuestionnaireEditor({ questionnaire }: { questionnaire: Questionnaire }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(questionnaire.title)
  const [clientName, setClientName] = useState(questionnaire.client_name)
  const [questions, setQuestions] = useState<Question[]>(questionnaire.questions)
  const [copied, setCopied] = useState(false)

  const clientUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/intake/${questionnaire.session_id}`

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', question_type: 'OPEN_ENDED', is_required: true },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const copyUrl = async () => {
    await navigator.clipboard.writeText(clientUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/questionnaires/${questionnaire.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          client_name: clientName,
          questions: questions.filter(q => q.question_text.trim()),
        }),
      })

      if (res.ok) {
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error?.message || 'Failed to update questionnaire')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Edit Questionnaire</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client URL Card */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4">
              <Label className="text-sm font-medium text-green-800">Client URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={clientUrl}
                  readOnly
                  className="bg-white font-mono text-sm"
                />
                <Button type="button" variant="outline" onClick={copyUrl}>
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(clientUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Questionnaire Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Pre-Consultation Discovery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., AgriTech Solutions"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={q.id || index}
                  className="p-4 border rounded-lg bg-gray-50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      <span className="text-sm font-medium text-gray-600">
                        Question {index + 1}
                      </span>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Textarea
                    placeholder="Enter your question..."
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <select
                        className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                        value={q.question_type}
                        onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                      >
                        <option value="OPEN_ENDED">Open Ended (Long)</option>
                        <option value="SHORT_ANSWER">Short Answer</option>
                        <option value="FILE_UPLOAD">File Upload</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={q.is_required}
                        onChange={(e) => updateQuestion(index, 'is_required', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`required-${index}`} className="text-sm">
                        Required
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
