import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'

// GET all responses for a questionnaire
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const questionnaire = await prisma.questionnaires.findUnique({
      where: { session_id: params.sessionId },
    })

    if (!questionnaire) {
      return errorResponse('Questionnaire not found', 404)
    }

    const responses = await prisma.responses.findMany({
      where: { questionnaire_id: questionnaire.id },
      include: {
        question: true,
      },
      orderBy: {
        question: {
          display_order: 'asc',
        },
      },
    })

    return successResponse(responses)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST/PUT save a response (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await request.json()
    const { question_id, response_text, file_url } = body

    if (!question_id) {
      return errorResponse('question_id is required', 400)
    }

    const questionnaire = await prisma.questionnaires.findUnique({
      where: { session_id: params.sessionId },
      include: { questions: true },
    })

    if (!questionnaire) {
      return errorResponse('Questionnaire not found', 404)
    }

    if (questionnaire.status === 'COMPLETED') {
      return errorResponse('Questionnaire already submitted', 400)
    }

    // Verify question belongs to this questionnaire
    const question = questionnaire.questions.find(q => q.id === question_id)
    if (!question) {
      return errorResponse('Question not found in this questionnaire', 404)
    }

    // Update questionnaire status to IN_PROGRESS if NOT_STARTED
    if (questionnaire.status === 'NOT_STARTED') {
      await prisma.questionnaires.update({
        where: { id: questionnaire.id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    // Upsert the response
    const response = await prisma.responses.upsert({
      where: {
        questionnaire_id_question_id: {
          questionnaire_id: questionnaire.id,
          question_id,
        },
      },
      create: {
        questionnaire_id: questionnaire.id,
        question_id,
        response_text,
        file_url,
      },
      update: {
        response_text,
        file_url,
        updated_at: new Date(),
      },
    })

    return successResponse(response)
  } catch (error) {
    return handleApiError(error)
  }
}
