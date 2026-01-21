import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'

// GET questionnaire by session ID (public - for clients)
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
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
      return errorResponse('Questionnaire not found', 404)
    }

    return successResponse(questionnaire)
  } catch (error) {
    return handleApiError(error)
  }
}
