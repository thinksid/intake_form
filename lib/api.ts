import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    { error: { message } },
    { status }
  )
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return errorResponse(error.message, 400)
  }

  return errorResponse('An unexpected error occurred', 500)
}
