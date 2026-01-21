import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QuestionnaireEditor from '@/components/admin/QuestionnaireEditor'

export default async function EditQuestionnairePage({
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
    },
  })

  if (!questionnaire) {
    notFound()
  }

  return <QuestionnaireEditor questionnaire={questionnaire} />
}
