import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QuestionView from '@/components/client/QuestionView'

export default async function QuestionPage({
  params,
}: {
  params: { sessionId: string; number: string }
}) {
  const questionNumber = parseInt(params.number)

  if (isNaN(questionNumber) || questionNumber < 1) {
    notFound()
  }

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

  const question = questionnaire.questions[questionNumber - 1]

  if (!question) {
    // Beyond total questions, redirect to review
    redirect(`/intake/${params.sessionId}/review`)
  }

  // Get existing response for this question
  const existingResponse = questionnaire.responses.find(
    r => r.question_id === question.id
  )

  // Serialize dates for client component
  const serializedResponse = existingResponse ? {
    ...existingResponse,
    created_at: existingResponse.created_at?.toISOString() || null,
    updated_at: existingResponse.updated_at?.toISOString() || null,
  } : undefined

  return (
    <QuestionView
      sessionId={params.sessionId}
      question={question}
      questionNumber={questionNumber}
      totalQuestions={questionnaire.questions.length}
      existingResponse={serializedResponse}
    />
  )
}
