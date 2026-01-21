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

  return <ResponseViewer questionnaire={questionnaire} />
}
