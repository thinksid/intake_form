'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Send,
  Edit2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'

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
}

interface Questionnaire {
  id: string
  title: string
  client_name: string
  questions: Question[]
  responses: Response[]
}

interface ReviewViewProps {
  sessionId: string
  questionnaire: Questionnaire
}

export default function ReviewView({ sessionId, questionnaire }: ReviewViewProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Create response map
  const responseMap = new Map(
    questionnaire.responses.map(r => [r.question_id, r])
  )

  // Check for unanswered required questions
  const unansweredRequired = questionnaire.questions.filter(
    q => q.is_required && !responseMap.has(q.id)
  )

  const canSubmit = unansweredRequired.length === 0

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/intake/${sessionId}/submit`, {
        method: 'POST',
      })

      if (res.ok) {
        router.push(`/intake/${sessionId}/complete`)
      } else {
        const data = await res.json()
        setError(data.error?.message || 'Failed to submit')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const goToQuestion = (index: number) => {
    router.push(`/intake/${sessionId}/q/${index + 1}`)
  }

  return (
    <div className="min-h-screen bg-client-portal">
      {/* Header with Logo */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Image
              src="https://invnydvuebmoytslovdh.supabase.co/storage/v1/object/sign/site%20images/azul%20t.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2RiZDUxYS1mMGNjLTRiNDktOWFkYi00ZmIxOGY4Y2U1ZDIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXRlIGltYWdlcy9henVsIHQucG5nIiwiaWF0IjoxNzY4OTY4ODU0LCJleHAiOjE4MDA1MDQ4NTR9.x_ymFmQqusLYNWPZC0ZNG2Z_YiRq3Ii-yx5MYj2kGcQ"
              alt="Antigravity Logo"
              width={100}
              height={32}
              className="h-6 w-auto"
              priority
            />
            <Badge variant="info">Review</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Header Card */}
        <Card className="shadow-card animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading text-thinksid-navy">
              Review Your Answers
            </CardTitle>
            <p className="text-slate-gray mt-2">
              Please review your responses before submitting
            </p>
          </CardHeader>
        </Card>

        {/* Validation Warning */}
        {!canSubmit && (
          <Card className="bg-red-50 border-red-200 shadow-soft animate-slide-up">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">
                    {unansweredRequired.length} required question{unansweredRequired.length > 1 ? 's' : ''} still need answers
                  </p>
                  <ul className="mt-3 space-y-2">
                    {unansweredRequired.map((q) => (
                      <li key={q.id}>
                        <button
                          onClick={() => goToQuestion(q.display_order)}
                          className="text-sm text-red-700 hover:text-red-800 hover:underline text-left transition-colors"
                        >
                          Question {q.display_order + 1}: {q.question_text.slice(0, 50)}...
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions & Responses */}
        <div className="space-y-4">
          {questionnaire.questions.map((q, index) => {
            const response = responseMap.get(q.id)
            const hasResponse = response?.response_text || response?.file_url

            return (
              <Card
                key={q.id}
                className={`transition-all duration-200 shadow-soft animate-slide-up ${
                  !hasResponse && q.is_required
                    ? 'border-red-200 bg-red-50/50'
                    : 'hover:shadow-card'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-sm font-semibold text-thinksid-navy">
                          Q{index + 1}
                        </span>
                        {q.is_required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {hasResponse ? (
                          <div className="w-5 h-5 rounded-full bg-electric-lime flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-thinksid-navy" />
                          </div>
                        ) : q.is_required ? (
                          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </div>
                        ) : null}
                      </div>

                      <p className="text-sm font-medium text-thinksid-navy mb-3">
                        {q.question_text}
                      </p>

                      {response?.response_text ? (
                        <div className="text-sm text-thinksid-navy/80 whitespace-pre-wrap bg-thinksid-navy/5 p-4 rounded-xl">
                          {response.response_text}
                        </div>
                      ) : response?.file_url ? (
                        <a
                          href={response.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-thinksid-navy font-medium hover:text-thinksid-navy/80 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Attachment
                        </a>
                      ) : (
                        <p className="text-sm text-slate-gray italic">
                          {q.is_required ? 'Required - Please provide an answer' : 'No answer provided'}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => goToQuestion(index)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200 animate-slide-up">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Card className="shadow-soft">
          <CardContent className="py-5">
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push(`/intake/${sessionId}/q/${questionnaire.questions.length}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                variant="cta"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                size="lg"
                className="min-w-[180px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
