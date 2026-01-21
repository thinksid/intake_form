import { questionnaire_status, question_type } from '@prisma/client'

export type QuestionnaireStatus = questionnaire_status
export type QuestionType = question_type

export interface Questionnaire {
  id: string
  session_id: string
  title: string
  client_name: string
  status: QuestionnaireStatus
  created_at: Date | null
  updated_at: Date | null
  completed_at: Date | null
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
  created_at: Date | null
}

export interface Response {
  id: string
  questionnaire_id: string
  question_id: string
  response_text: string | null
  file_url: string | null
  created_at: Date | null
  updated_at: Date | null
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
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}
