'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import VoiceInput from './VoiceInput'
import FileUpload from './FileUpload'

interface Question {
  id: string
  question_text: string
  question_type: 'OPEN_ENDED' | 'SHORT_ANSWER' | 'FILE_UPLOAD'
  is_required: boolean
  display_order: number
}

interface Response {
  id: string
  response_text: string | null
  file_url: string | null
}

interface QuestionViewProps {
  sessionId: string
  question: Question
  questionNumber: number
  totalQuestions: number
  existingResponse?: Response | null
}

export default function QuestionView({
  sessionId,
  question,
  questionNumber,
  totalQuestions,
  existingResponse,
}: QuestionViewProps) {
  const router = useRouter()
  const [answer, setAnswer] = useState(existingResponse?.response_text || '')
  const [fileUrl, setFileUrl] = useState(existingResponse?.file_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to always have current values in callbacks without causing re-renders
  const answerRef = useRef(answer)
  const fileUrlRef = useRef(fileUrl)

  // Keep refs in sync
  useEffect(() => {
    answerRef.current = answer
  }, [answer])

  useEffect(() => {
    fileUrlRef.current = fileUrl
  }, [fileUrl])

  const progress = (questionNumber / totalQuestions) * 100
  const isLastQuestion = questionNumber === totalQuestions
  const isFileQuestion = question.question_type === 'FILE_UPLOAD'

  // Determine if we can proceed
  const hasAnswer = isFileQuestion ? !!fileUrl : !!answer.trim()
  const canProceed = !question.is_required || hasAnswer

  // Auto-save function - uses refs to get current values
  const saveAnswer = useCallback(async (showIndicator = true) => {
    const currentAnswer = answerRef.current
    const currentFileUrl = fileUrlRef.current
    const currentHasAnswer = isFileQuestion ? !!currentFileUrl : !!currentAnswer.trim()

    if (!currentHasAnswer) return

    if (showIndicator) setSaving(true)

    try {
      await fetch(`/api/intake/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          response_text: isFileQuestion ? null : currentAnswer,
          file_url: isFileQuestion ? currentFileUrl : null,
        }),
      })

      if (showIndicator) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      if (showIndicator) setSaving(false)
    }
  }, [sessionId, question.id, isFileQuestion])

  // Auto-save with debounce
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    const currentHasAnswer = isFileQuestion ? !!fileUrl : !!answer.trim()
    if (currentHasAnswer) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveAnswer(false)
      }, 1500)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [answer, fileUrl, isFileQuestion, saveAnswer])

  const handleNext = async () => {
    if (hasAnswer) {
      await saveAnswer(true)
    }

    if (isLastQuestion) {
      router.push(`/intake/${sessionId}/review`)
    } else {
      router.push(`/intake/${sessionId}/q/${questionNumber + 1}`)
    }
  }

  const handleBack = () => {
    if (questionNumber > 1) {
      router.push(`/intake/${sessionId}/q/${questionNumber - 1}`)
    } else {
      router.push(`/intake/${sessionId}`)
    }
  }

  const handleVoiceTranscript = useCallback((text: string) => {
    setAnswer(text)
  }, [])

  const handleVoiceReset = useCallback(() => {
    setAnswer('')
  }, [])

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
            <div className="text-sm font-medium text-slate-gray">
              {questionNumber} of {totalQuestions}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-white">
              Question {questionNumber}
            </span>
            <span className="text-white font-medium">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="shadow-elevated animate-scale-in">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {question.is_required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-semibold font-heading text-thinksid-navy leading-tight">
                {question.question_text}
              </h2>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isFileQuestion ? (
              <FileUpload
                sessionId={sessionId}
                currentFileUrl={fileUrl}
                onFileChange={(url) => setFileUrl(url || '')}
              />
            ) : (
              <>
                {/* Voice Input */}
                <VoiceInput
                  onTranscriptChange={handleVoiceTranscript}
                  onReset={handleVoiceReset}
                  currentText={answer}
                />

                {/* Text Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-gray block">
                    Or type your response:
                  </label>
                  {question.question_type === 'OPEN_ENDED' ? (
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={6}
                      className="text-base"
                    />
                  ) : (
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="text-base"
                    />
                  )}
                </div>
              </>
            )}

            {/* Save Indicator */}
            <div className="h-6 flex items-center">
              {saving && (
                <div className="flex items-center gap-2 text-sm text-slate-gray animate-pulse-soft">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              {saved && (
                <div className="flex items-center gap-2 text-sm text-thinksid-navy animate-slide-up">
                  <div className="w-5 h-5 rounded-full bg-electric-lime flex items-center justify-center">
                    <Check className="w-3 h-3 text-thinksid-navy" />
                  </div>
                  <span className="font-medium">Saved</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="shadow-soft">
          <CardContent className="py-5">
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                variant="cta"
                onClick={handleNext}
                disabled={!canProceed || saving}
                size="lg"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Review
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {!canProceed && question.is_required && (
              <p className="text-sm text-red-500 text-center mt-4 animate-slide-up">
                This question requires an answer
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
