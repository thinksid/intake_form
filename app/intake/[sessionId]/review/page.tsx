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

  // Serialize dates for client component
  const serializedQuestionnaire = {
    ...questionnaire,
    responses: questionnaire.responses.map(r => ({
      ...r,
      created_at: r.created_at?.toISOString() || null,
      updated_at: r.updated_at?.toISOString() || null,
    })),
    created_at: questionnaire.created_at?.toISOString() || null,
    updated_at: questionnaire.updated_at?.toISOString() || null,
    completed_at: questionnaire.completed_at?.toISOString() || null,
  }

  return (
    <ReviewView
      sessionId={params.sessionId}
      questionnaire={serializedQuestionnaire}
    />
  )
}
