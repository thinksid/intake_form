import { questionnaire_status, question_type } from '@prisma/client'

export type QuestionnaireStatus = questionnaire_status
export type QuestionType = question_type

export interface Questionnaire {
  id: string
  session_id: string
  title: string
  client_name: string
  status: QuestionnaireStatus
  created_at: Date | string | null
  updated_at: Date | string | null
  completed_at: Date | string | null
  questions?: Question[]
  responses?: Response[]
}

export interface Question {
  id: string
  questionnaire_id: string
  question_text: string
  question_type: QuestionType
  is_required: boolean
  display_order: number
  created_at: Date | string | null
}

export interface Response {
  id: string
  questionnaire_id: string
  question_id: string
  response_text: string | null
  file_url: string | null
  file_urls: string | null  // JSON string of array
  created_at: Date | string | null
  updated_at: Date | string | null
  question?: Question
}

export interface CreateQuestionnaireInput {
  title: string
  client_name: string
  questions: CreateQuestionInput[]
}

export interface CreateQuestionInput {
  question_text: string
  question_type: QuestionType
  is_required: boolean
}

export interface SaveResponseInput {
  question_id: string
  response_text?: string
  file_url?: string
  file_urls?: string[]  // Array of file URLs
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export interface FileAttachment {
  name: string
  url: string
  uploading?: boolean
}
