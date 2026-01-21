import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'
import { generateSessionId } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET all questionnaires
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const questionnaires = await prisma.questionnaires.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        questions: {
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    })

    return successResponse(questionnaires)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create new questionnaire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { title, client_name, questions } = body

    if (!title || !client_name) {
      return errorResponse('Title and client name are required', 400)
    }

    const sessionId = generateSessionId()

    const questionnaire = await prisma.questionnaires.create({
      data: {
        session_id: sessionId,
        title,
        client_name,
        questions: {
          create: (questions || []).map((q: any, index: number) => ({
            question_text: q.question_text,
            question_type: q.question_type || 'OPEN_ENDED',
            is_required: q.is_required ?? true,
            display_order: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { display_order: 'asc' },
        },
      },
    })

    return successResponse(questionnaire, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
