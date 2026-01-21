import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ResponseViewer from '@/components/admin/ResponseViewer'

export default async function ResponsesPage({
  params,
}: {
  params: { id: string }
}) {
  const questionnaire = await prisma.questionnaires.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { display_order: 'asc' },
      },
      responses: {
        include: {
          question: true,
        },
      },
    },
  })

  if (!questionnaire) {
    notFound()
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

  return <ResponseViewer questionnaire={serializedQuestionnaire} />
}
