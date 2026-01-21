import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReviewView from '@/components/client/ReviewView'

export default async function ReviewPage({
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

  return (
    <ReviewView
      sessionId={params.sessionId}
      questionnaire={questionnaire}
    />
  )
}
