import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'

// POST submit questionnaire
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const questionnaire = await prisma.questionnaires.findUnique({
      where: { session_id: params.sessionId },
      include: {
        questions: true,
        responses: true,
      },
    })

    if (!questionnaire) {
      return errorResponse('Questionnaire not found', 404)
    }

    if (questionnaire.status === 'COMPLETED') {
      return errorResponse('Questionnaire already submitted', 400)
    }

    // Check all required questions have responses
    const responseMap = new Map(
      questionnaire.responses.map(r => [r.question_id, r])
    )

    const unansweredRequired = questionnaire.questions.filter(
      q => q.is_required && !responseMap.has(q.id)
    )

    if (unansweredRequired.length > 0) {
      return errorResponse(
        `Please answer all required questions. ${unansweredRequired.length} remaining.`,
        400
      )
    }

    // Mark questionnaire as completed
    const updated = await prisma.questionnaires.update({
      where: { id: questionnaire.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
