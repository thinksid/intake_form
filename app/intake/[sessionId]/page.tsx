import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

export default async function WelcomePage({
  params,
}: {
  params: { sessionId: string }
}) {
  const questionnaire = await prisma.questionnaires.findUnique({
    where: { session_id: params.sessionId },
    include: {
      questions: {
        orderBy: { display_order: 'asc' },
      },
      responses: true,
    },
  })

  if (!questionnaire) {
    notFound()
  }

  if (questionnaire.status === 'COMPLETED') {
    redirect(`/intake/${params.sessionId}/complete`)
  }

  const questionCount = questionnaire.questions.length
  const answeredCount = questionnaire.responses.length
  const estimatedMinutesMin = questionCount
  const estimatedMinutesMax = Math.floor(questionCount * 1.5)

  // If there are existing responses, calculate which question to resume from
  const answeredQuestionIds = new Set(questionnaire.responses.map(r => r.question_id))
  let resumeIndex = 1
  for (let i = 0; i < questionnaire.questions.length; i++) {
    if (!answeredQuestionIds.has(questionnaire.questions[i].id)) {
      resumeIndex = i + 1
      break
    }
  }

  const isResuming = answeredCount > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-client-portal px-4 py-8">
      {/* Background decoration is now handled by bg-client-portal */}

      <Card className="max-w-2xl w-full shadow-elevated relative animate-scale-in">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="https://invnydvuebmoytslovdh.supabase.co/storage/v1/object/sign/site%20images/azul%20t.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2RiZDUxYS1mMGNjLTRiNDktOWFkYi00ZmIxOGY4Y2U1ZDIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXRlIGltYWdlcy9henVsIHQucG5nIiwiaWF0IjoxNzY4OTY4ODU0LCJleHAiOjE4MDA1MDQ4NTR9.x_ymFmQqusLYNWPZC0ZNG2Z_YiRq3Ii-yx5MYj2kGcQ"
              alt="Antigravity Logo"
              width={160}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold font-heading text-thinksid-navy">
            Welcome, {questionnaire.client_name}.
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Questionnaire Info */}
          <div className="text-center space-y-3">
            <p className="text-lg text-slate-gray">
              This is your <span className="font-semibold text-thinksid-navy">{questionnaire.title}</span> questionnaire.
            </p>
            <p className="text-slate-gray leading-relaxed">
              By completing this, you are helping us deeply understand your business ahead of our consultation process.
            </p>
          </div>

          {/* Description Card */}
          <div className="bg-thinksid-navy/5 rounded-2xl p-5 space-y-4">

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-soft">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-thinksid-navy" />
                <span className="text-sm font-medium text-thinksid-navy block">{questionCount}</span>
                <span className="text-xs text-slate-gray">questions</span>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-soft">
                <Clock className="w-5 h-5 mx-auto mb-1 text-thinksid-navy" />
                <span className="text-sm font-medium text-thinksid-navy block">{estimatedMinutesMin}-{estimatedMinutesMax}</span>
                <span className="text-xs text-slate-gray">minutes</span>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-soft">
                <Mic className="w-5 h-5 mx-auto mb-1 text-electric-lime" />
                <span className="text-sm font-medium text-thinksid-navy block">Voice</span>
                <span className="text-xs text-slate-gray">enabled</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-electric-lime/15 border border-electric-lime/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-thinksid-navy" />
              <h3 className="font-semibold font-heading text-thinksid-navy">How it works</h3>
            </div>
            <ul className="space-y-2">
              {[
                'Answer one question at a time',
                'Use your voice or type your answer, as you prefer',
                'Your progress is saved each time you hit "Next"',
                'Review and submit when done',
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-thinksid-navy/80">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-thinksid-navy text-white flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resume Progress */}
          {isResuming && (
            <div className="bg-thinksid-navy/5 border border-thinksid-navy/10 rounded-2xl p-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-lime flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-thinksid-navy" />
                </div>
                <div>
                  <p className="font-medium text-thinksid-navy">
                    {answeredCount} of {questionCount} completed
                  </p>
                  <p className="text-sm text-slate-gray">
                    Pick up where you left off
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Link href={`/intake/${params.sessionId}/q/${resumeIndex}`} className="block">
            <Button variant="cta" size="xl" className="w-full text-lg">
              {isResuming ? 'Continue Questionnaire' : 'Start Questionnaire'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
