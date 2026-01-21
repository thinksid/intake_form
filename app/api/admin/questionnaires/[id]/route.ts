import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET single questionnaire
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

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
      return errorResponse('Questionnaire not found', 404)
    }

    return successResponse(questionnaire)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH update questionnaire
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { title, client_name, status, questions } = body

    // Update questionnaire fields
    const updateData: any = {}
    if (title) updateData.title = title
    if (client_name) updateData.client_name = client_name
    if (status) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completed_at = new Date()
      }
    }

    const questionnaire = await prisma.questionnaires.update({
      where: { id: params.id },
      data: updateData,
    })

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
      // Delete existing questions and create new ones
      await prisma.questions.deleteMany({
        where: { questionnaire_id: params.id },
      })

      await prisma.questions.createMany({
        data: questions.map((q: any, index: number) => ({
          questionnaire_id: params.id,
          question_text: q.question_text,
          question_type: q.question_type || 'OPEN_ENDED',
          is_required: q.is_required ?? true,
          display_order: index,
        })),
      })
    }

    const updated = await prisma.questionnaires.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { display_order: 'asc' },
        },
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE questionnaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    await prisma.questionnaires.delete({
      where: { id: params.id },
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
