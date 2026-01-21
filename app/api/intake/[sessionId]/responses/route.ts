import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api'
import { parseFileUrls } from '@/lib/utils'

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

    // Add parsed file URLs for client convenience
    const responsesWithParsedFiles = responses.map(r => ({
      ...r,
      parsedFileUrls: parseFileUrls(r),
    }))

    return successResponse(responsesWithParsedFiles)
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
    const { question_id, response_text, file_url, file_urls } = body

    if (!question_id) {
      return errorResponse('question_id is required', 400)
    }

    // Validate file_urls if provided
    if (file_urls) {
      if (!Array.isArray(file_urls)) {
        return errorResponse('file_urls must be an array', 400)
      }
      if (file_urls.length === 0) {
        return errorResponse('file_urls cannot be empty', 400)
      }
      // Validate each URL
      for (const url of file_urls) {
        if (typeof url !== 'string' || url.trim() === '') {
          return errorResponse('Invalid URL in file_urls', 400)
        }
      }
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

    // Prepare data for upsert
    const fileUrlsJson = file_urls ? JSON.stringify(file_urls) : null
    const singleFileUrl = file_urls && file_urls.length > 0 ? file_urls[0] : file_url

    // Upsert the response with dual-write
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
        file_url: singleFileUrl,      // BACKWARD COMPAT: Store first file
        file_urls: fileUrlsJson,       // NEW: Store all files as JSON
      },
      update: {
        response_text,
        file_url: singleFileUrl,       // BACKWARD COMPAT
        file_urls: fileUrlsJson,       // NEW
        updated_at: new Date(),
      },
    })

    return successResponse(response)
  } catch (error) {
    return handleApiError(error)
  }
}
