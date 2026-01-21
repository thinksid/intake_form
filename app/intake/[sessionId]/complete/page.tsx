import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Sparkles, Mail, Calendar } from 'lucide-react'

export default async function CompletePage({
  params,
}: {
  params: { sessionId: string }
}) {
  const questionnaire = await prisma.questionnaires.findUnique({
    where: { session_id: params.sessionId },
  })

  if (!questionnaire) {
    notFound()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-client-portal px-4 py-8">
      {/* Background decoration is now handled by bg-client-portal */}

      <Card className="max-w-lg w-full shadow-elevated text-center relative animate-scale-in">
        <CardHeader className="pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="https://invnydvuebmoytslovdh.supabase.co/storage/v1/object/sign/site%20images/azul%20t.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2RiZDUxYS1mMGNjLTRiNDktOWFkYi00ZmIxOGY4Y2U1ZDIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzaXRlIGltYWdlcy9henVsIHQucG5nIiwiaWF0IjoxNzY4OTY4ODU0LCJleHAiOjE4MDA1MDQ4NTR9.x_ymFmQqusLYNWPZC0ZNG2Z_YiRq3Ii-yx5MYj2kGcQ"
              alt="Antigravity Logo"
              width={140}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-electric-lime rounded-full flex items-center justify-center shadow-elevated animate-scale-in">
              <CheckCircle className="w-12 h-12 text-thinksid-navy" />
            </div>
          </div>

          <CardTitle className="text-2xl md:text-3xl font-bold font-heading text-thinksid-navy">
            Thank You!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-lg text-thinksid-navy/80">
              Your questionnaire has been submitted successfully.
            </p>
            <p className="text-slate-gray">
              <span className="font-semibold text-thinksid-navy">{questionnaire.client_name}</span>
              <span className="mx-2">-</span>
              {questionnaire.title}
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-electric-lime/15 border border-electric-lime/30 rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-thinksid-navy" />
              <h3 className="font-semibold font-heading text-thinksid-navy">What happens next?</h3>
            </div>
            <ul className="space-y-3">
              {[
                { icon: CheckCircle, text: 'Your responses have been securely saved' },
                { icon: Mail, text: 'The consulting team will review your answers' },
                { icon: Calendar, text: "You'll hear from them soon to schedule your consultation" },
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-thinksid-navy/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3 h-3 text-thinksid-navy" />
                  </div>
                  <span className="text-sm text-thinksid-navy/80">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-slate-gray">
            You can safely close this page now.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
