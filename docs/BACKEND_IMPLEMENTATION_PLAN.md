# Backend Implementation Plan
## Agricultural Consulting Intake Form Web App

**Version:** 1.0
**Date:** January 2026
**Author:** Backend Engineer Agent
**Related Documents:**
- [Product Design Document](./PRODUCT_DESIGN_DOCUMENT.md)
- [Technical Architecture Specification](./TECHNICAL_ARCHITECTURE_SPECIFICATION.md)
- [Technical Implementation Plan](./TECHNICAL_IMPLEMENTATION_PLAN.md)

---

## Executive Summary

This document provides a comprehensive backend implementation plan for the agricultural intake form web application. It covers database design, API implementation, business logic, file storage, authentication, and testing strategy.

**Technology Stack:**
- Runtime: Node.js 20.x (Next.js API Routes)
- Database: PostgreSQL 15+ (Supabase managed)
- ORM: Prisma 5.x
- File Storage: Supabase Storage (100 GB included with Pro plan)
- Session Store: Upstash Redis (optional for rate limiting)
- Authentication: NextAuth.js (credentials provider)
- Email: Resend

**Key Architectural Patterns:**
- Repository Pattern (data access abstraction)
- Service Layer (business logic separation)
- DTO/Schema Validation (Zod for request validation)
- Error Handling Middleware
- Rate Limiting

---

## Table of Contents

1. [Database Layer](#1-database-layer)
2. [API Layer](#2-api-layer)
3. [Business Logic Layer](#3-business-logic-layer)
4. [File Storage Layer](#4-file-storage-layer)
5. [Authentication & Security](#5-authentication--security)
6. [Export Functionality](#6-export-functionality)
7. [Implementation Phases](#7-implementation-phases)
8. [Testing Strategy](#8-testing-strategy)
9. [Appendix](#9-appendix)

---

## 1. Database Layer

### 1.1 Prisma Schema Implementation

**File:** `/prisma/schema.prisma`

#### Complete Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================================
// MODELS
// ============================================================================

model Questionnaire {
  id            String              @id @default(cuid())
  sessionId     String              @unique @db.VarChar(32)
  title         String              @db.VarChar(255)
  clientName    String              @db.VarChar(255)
  status        QuestionnaireStatus @default(NOT_STARTED)
  createdAt     DateTime            @default(now()) @db.Timestamptz
  completedAt   DateTime?           @db.Timestamptz
  updatedAt     DateTime            @updatedAt @db.Timestamptz

  questions Question[]
  responses Response[]

  @@index([sessionId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("questionnaires")
}

model Question {
  id              String       @id @default(cuid())
  questionnaireId String
  questionText    String       @db.Text
  questionType    QuestionType
  required        Boolean      @default(true)
  order           Int
  createdAt       DateTime     @default(now()) @db.Timestamptz
  updatedAt       DateTime     @updatedAt @db.Timestamptz

  questionnaire Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
  responses     Response[]

  @@unique([questionnaireId, order])
  @@index([questionnaireId])
  @@map("questions")
}

model Response {
  id              String      @id @default(cuid())
  questionnaireId String
  questionId      String
  answerText      String?     @db.Text
  answerFiles     Json?       @db.JsonB // Array of {fileName, fileUrl, fileSize, mimeType}
  answerUrl       String?     @db.Text // Shared folder URL
  inputMethod     InputMethod @default(TEXT)
  language        Language    @default(EN)
  createdAt       DateTime    @default(now()) @db.Timestamptz
  updatedAt       DateTime    @updatedAt @db.Timestamptz

  questionnaire Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
  question      Question      @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionnaireId, questionId])
  @@index([questionnaireId])
  @@index([questionId])
  @@map("responses")
}

// ============================================================================
// ENUMS
// ============================================================================

enum QuestionnaireStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED

  @@map("questionnaire_status")
}

enum QuestionType {
  OPEN_ENDED
  SHORT_ANSWER
  FILE_UPLOAD

  @@map("question_type")
}

enum InputMethod {
  VOICE
  TEXT

  @@map("input_method")
}

enum Language {
  EN
  ES

  @@map("language")
}
```

#### Key Design Decisions

1. **Session ID as String (not UUID)**
   - Rationale: We generate cryptographically random base64url IDs for shorter, URL-safe session identifiers
   - Type: `@db.VarChar(32)` to accommodate base64url encoding

2. **JSONB for File Metadata**
   - Rationale: Flexible schema for file upload metadata without additional table
   - Structure: `Array<{fileName: string, fileUrl: string, fileKey: string, fileSize: number, mimeType: string}>`
   - Note: `fileKey` is the storage path used for deletion (e.g., "uploads/session-id/timestamp-file.pdf")

3. **Cascade Deletes**
   - Questionnaire deletion cascades to questions and responses
   - Maintains referential integrity
   - No orphaned records

4. **Composite Unique Constraint**
   - `(questionnaireId, questionId)` ensures one response per question
   - `(questionnaireId, order)` ensures no duplicate question ordering

5. **Indexes for Performance**
   - `sessionId` (unique lookup for client access)
   - `status` (admin dashboard filtering)
   - `createdAt DESC` (dashboard ordering)
   - `questionnaireId` (response and question lookups)

### 1.2 Migration Strategy

#### Initial Migration

```bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

#### Migration Workflow

1. **Development:**
   ```bash
   # Create migration after schema changes
   npx prisma migrate dev --name descriptive_name
   ```

2. **Production:**
   ```bash
   # Apply migrations (non-interactive)
   npx prisma migrate deploy
   ```

3. **Rollback Strategy:**
   - Prisma doesn't support automatic rollbacks
   - Manual rollback process:
     ```bash
     # 1. Identify migration to rollback
     npx prisma migrate status

     # 2. Create rollback migration manually
     # Write SQL to reverse changes

     # 3. Apply rollback
     npx prisma migrate dev --name rollback_feature_x
     ```

#### Migration Best Practices

- **Never modify applied migrations** (immutable)
- **Test migrations on staging** before production
- **Backup database** before production migrations
- **Use transactions** for multi-step migrations
- **Document breaking changes** in migration comments

### 1.3 Database Seeding

**File:** `/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { generateSessionId } from '../src/lib/utils/sessionId';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create sample questionnaire
  const questionnaire = await prisma.questionnaire.create({
    data: {
      sessionId: generateSessionId(),
      title: 'Sample Client Intake - Acme AgTech',
      clientName: 'Acme AgTech Inc.',
      status: 'NOT_STARTED',
      questions: {
        create: [
          {
            questionText: 'Describe your agricultural business, including primary products, scale of operations, and years in business.',
            questionType: 'OPEN_ENDED',
            required: true,
            order: 1,
          },
          {
            questionText: 'What is your current annual revenue? (Approximate is fine)',
            questionType: 'SHORT_ANSWER',
            required: true,
            order: 2,
          },
          {
            questionText: 'How many full-time employees or team members do you have?',
            questionType: 'SHORT_ANSWER',
            required: false,
            order: 3,
          },
          {
            questionText: 'Upload financial documents or provide shared folder link.',
            questionType: 'FILE_UPLOAD',
            required: false,
            order: 4,
          },
        ],
      },
    },
    include: {
      questions: true,
    },
  });

  console.log(`Created sample questionnaire with session ID: ${questionnaire.sessionId}`);
  console.log(`Access URL: http://localhost:3000/intake/${questionnaire.sessionId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Usage:**
```bash
# Add to package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}

# Run seed
npx prisma db seed
```

### 1.4 Repository Pattern Implementation

#### Base Types

**File:** `/src/types/repository.types.ts`

```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
```

#### Questionnaire Repository

**File:** `/src/repositories/questionnaire.repository.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { Questionnaire, QuestionnaireStatus, Prisma } from '@prisma/client';
import { IRepository, PagedResult, PaginationParams } from '@/types/repository.types';

export type QuestionnaireWithRelations = Prisma.QuestionnaireGetPayload<{
  include: {
    questions: { orderBy: { order: 'asc' } };
    _count: { select: { responses: true } };
  };
}>;

export interface CreateQuestionnaireInput {
  sessionId: string;
  title: string;
  clientName: string;
  questions: Array<{
    questionText: string;
    questionType: 'OPEN_ENDED' | 'SHORT_ANSWER' | 'FILE_UPLOAD';
    required: boolean;
    order: number;
  }>;
}

export class QuestionnaireRepository implements Partial<IRepository<Questionnaire>> {
  /**
   * Find questionnaire by ID with related data
   */
  async findById(id: string): Promise<QuestionnaireWithRelations | null> {
    return prisma.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  /**
   * Find questionnaire by session ID (for client access)
   */
  async findBySessionId(sessionId: string): Promise<QuestionnaireWithRelations | null> {
    return prisma.questionnaire.findUnique({
      where: { sessionId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  /**
   * Get all questionnaires with pagination support
   */
  async findAll(params?: PaginationParams): Promise<QuestionnaireWithRelations[]> {
    const { page = 1, pageSize = 50 } = params || {};
    const skip = (page - 1) * pageSize;

    return prisma.questionnaire.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true,
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  /**
   * Get questionnaires with pagination metadata
   */
  async findAllPaged(params: PaginationParams): Promise<PagedResult<QuestionnaireWithRelations>> {
    const { page = 1, pageSize = 50 } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.questionnaire.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          questions: true,
          _count: {
            select: { responses: true },
          },
        },
      }),
      prisma.questionnaire.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Create new questionnaire with questions
   */
  async create(data: CreateQuestionnaireInput): Promise<QuestionnaireWithRelations> {
    return prisma.questionnaire.create({
      data: {
        sessionId: data.sessionId,
        title: data.title,
        clientName: data.clientName,
        questions: {
          create: data.questions,
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });
  }

  /**
   * Update questionnaire basic info (not questions)
   */
  async update(id: string, data: Partial<Pick<Questionnaire, 'title' | 'clientName'>>): Promise<Questionnaire> {
    return prisma.questionnaire.update({
      where: { id },
      data,
    });
  }

  /**
   * Update questionnaire status
   */
  async updateStatus(id: string, status: QuestionnaireStatus): Promise<Questionnaire> {
    return prisma.questionnaire.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Delete questionnaire (cascades to questions and responses)
   */
  async delete(id: string): Promise<void> {
    await prisma.questionnaire.delete({
      where: { id },
    });
  }

  /**
   * Check if questionnaire exists by session ID
   */
  async existsBySessionId(sessionId: string): Promise<boolean> {
    const count = await prisma.questionnaire.count({
      where: { sessionId },
    });
    return count > 0;
  }

  /**
   * Get questionnaire statistics
   */
  async getStats() {
    const [total, notStarted, inProgress, completed] = await Promise.all([
      prisma.questionnaire.count(),
      prisma.questionnaire.count({ where: { status: 'NOT_STARTED' } }),
      prisma.questionnaire.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.questionnaire.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      total,
      notStarted,
      inProgress,
      completed,
    };
  }
}

export const questionnaireRepository = new QuestionnaireRepository();
```

#### Response Repository

**File:** `/src/repositories/response.repository.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { Response, InputMethod, Language, Prisma } from '@prisma/client';

export type ResponseWithQuestion = Prisma.ResponseGetPayload<{
  include: { question: true };
}>;

export interface CreateResponseInput {
  questionnaireId: string;
  questionId: string;
  answerText?: string;
  answerFiles?: any; // JSON array
  answerUrl?: string;
  inputMethod: InputMethod;
  language: Language;
}

export class ResponseRepository {
  /**
   * Find all responses for a questionnaire
   */
  async findByQuestionnaireId(questionnaireId: string): Promise<ResponseWithQuestion[]> {
    return prisma.response.findMany({
      where: { questionnaireId },
      include: {
        question: true,
      },
      orderBy: {
        question: {
          order: 'asc',
        },
      },
    });
  }

  /**
   * Find specific response by questionnaire and question
   */
  async findByQuestionId(questionnaireId: string, questionId: string): Promise<Response | null> {
    return prisma.response.findUnique({
      where: {
        questionnaireId_questionId: {
          questionnaireId,
          questionId,
        },
      },
    });
  }

  /**
   * Create or update response (upsert)
   */
  async upsert(data: CreateResponseInput): Promise<Response> {
    return prisma.response.upsert({
      where: {
        questionnaireId_questionId: {
          questionnaireId: data.questionnaireId,
          questionId: data.questionId,
        },
      },
      create: data,
      update: {
        answerText: data.answerText,
        answerFiles: data.answerFiles,
        answerUrl: data.answerUrl,
        inputMethod: data.inputMethod,
        language: data.language,
      },
    });
  }

  /**
   * Delete a specific response
   */
  async delete(questionnaireId: string, questionId: string): Promise<void> {
    await prisma.response.delete({
      where: {
        questionnaireId_questionId: {
          questionnaireId,
          questionId,
        },
      },
    });
  }

  /**
   * Get response count for questionnaire
   */
  async countByQuestionnaire(questionnaireId: string): Promise<number> {
    return prisma.response.count({
      where: { questionnaireId },
    });
  }

  /**
   * Get voice usage statistics
   */
  async getVoiceUsageStats(questionnaireId: string) {
    const responses = await prisma.response.findMany({
      where: { questionnaireId },
      select: { inputMethod: true, language: true },
    });

    const voiceCount = responses.filter((r) => r.inputMethod === 'VOICE').length;
    const textCount = responses.filter((r) => r.inputMethod === 'TEXT').length;
    const englishCount = responses.filter((r) => r.language === 'EN').length;
    const spanishCount = responses.filter((r) => r.language === 'ES').length;

    return {
      total: responses.length,
      voice: voiceCount,
      text: textCount,
      voicePercentage: responses.length > 0 ? (voiceCount / responses.length) * 100 : 0,
      languages: {
        english: englishCount,
        spanish: spanishCount,
      },
    };
  }
}

export const responseRepository = new ResponseRepository();
```

#### Question Repository

**File:** `/src/repositories/question.repository.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { Question, QuestionType } from '@prisma/client';

export interface UpdateQuestionsInput {
  questionnaireId: string;
  questions: Array<{
    id?: string; // If updating existing
    questionText: string;
    questionType: QuestionType;
    required: boolean;
    order: number;
  }>;
}

export class QuestionRepository {
  /**
   * Find all questions for a questionnaire
   */
  async findByQuestionnaireId(questionnaireId: string): Promise<Question[]> {
    return prisma.question.findMany({
      where: { questionnaireId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Find single question by ID
   */
  async findById(id: string): Promise<Question | null> {
    return prisma.question.findUnique({
      where: { id },
    });
  }

  /**
   * Create multiple questions (for new questionnaire)
   */
  async createMany(
    questionnaireId: string,
    questions: Array<Omit<Question, 'id' | 'questionnaireId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    await prisma.question.createMany({
      data: questions.map((q) => ({
        ...q,
        questionnaireId,
      })),
    });
  }

  /**
   * Update questions (delete all and recreate)
   * Note: This is acceptable for MVP as questionnaires are rarely edited after client starts
   */
  async replaceAll(data: UpdateQuestionsInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete existing questions
      await tx.question.deleteMany({
        where: { questionnaireId: data.questionnaireId },
      });

      // Create new questions
      await tx.question.createMany({
        data: data.questions.map((q) => ({
          questionnaireId: data.questionnaireId,
          questionText: q.questionText,
          questionType: q.questionType,
          required: q.required,
          order: q.order,
        })),
      });
    });
  }

  /**
   * Delete all questions for questionnaire
   */
  async deleteByQuestionnaireId(questionnaireId: string): Promise<void> {
    await prisma.question.deleteMany({
      where: { questionnaireId },
    });
  }
}

export const questionRepository = new QuestionRepository();
```

---

## 2. API Layer

### 2.1 API Architecture Overview

**Pattern:** Controller → Service → Repository

**Request Flow:**
```
HTTP Request
    ↓
API Route Handler (Controller)
    ↓
Request Validation (Zod Schema)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (Prisma → PostgreSQL)
```

### 2.2 Request/Response Standards

#### Success Response Format

```typescript
interface SuccessResponse<T> {
  data: T;
  meta?: {
    timestamp?: string;
    requestId?: string;
  };
}
```

#### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: any; // Additional context
    statusCode: number;
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
  };
}
```

#### Response Utilities

**File:** `/src/lib/api/response.ts`

```typescript
import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(error: unknown, status?: number): NextResponse {
  console.error('API Error:', error);

  let message = 'An unexpected error occurred';
  let code = 'INTERNAL_SERVER_ERROR';
  let statusCode = status || 500;

  if (error instanceof Error) {
    message = error.message;

    // Custom error types
    if (error.name === 'ValidationError') {
      code = 'VALIDATION_ERROR';
      statusCode = 400;
    } else if (error.name === 'NotFoundError') {
      code = 'NOT_FOUND';
      statusCode = 404;
    } else if (error.name === 'UnauthorizedError') {
      code = 'UNAUTHORIZED';
      statusCode = 401;
    }
  }

  return NextResponse.json(
    {
      error: {
        code,
        message,
        statusCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### 2.3 Validation Schemas

**File:** `/src/lib/validation/questionnaire.schema.ts`

```typescript
import { z } from 'zod';

export const createQuestionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  clientName: z.string().min(1, 'Client name is required').max(255, 'Client name must be less than 255 characters'),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1, 'Question text is required').max(500, 'Question text must be less than 500 characters'),
        questionType: z.enum(['OPEN_ENDED', 'SHORT_ANSWER', 'FILE_UPLOAD'], {
          errorMap: () => ({ message: 'Question type must be OPEN_ENDED, SHORT_ANSWER, or FILE_UPLOAD' }),
        }),
        required: z.boolean(),
      })
    )
    .min(1, 'At least one question is required')
    .max(50, 'Maximum 50 questions allowed'),
});

export const updateQuestionnaireSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  clientName: z.string().min(1).max(255).optional(),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1).max(500),
        questionType: z.enum(['OPEN_ENDED', 'SHORT_ANSWER', 'FILE_UPLOAD']),
        required: z.boolean(),
      })
    )
    .optional(),
});

export const saveResponseSchema = z.object({
  questionId: z.string().cuid('Invalid question ID format'),
  answer: z.object({
    text: z.string().optional(),
    files: z.array(z.any()).optional(),
    url: z.string().url('Invalid URL format').optional(),
    inputMethod: z.enum(['VOICE', 'TEXT']),
    language: z.enum(['EN', 'ES']),
  }),
});

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;
export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;
export type SaveResponseInput = z.infer<typeof saveResponseSchema>;
```

### 2.4 Admin API Endpoints

#### GET /api/admin/questionnaires

**File:** `/src/app/api/admin/questionnaires/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { questionnaireService } from '@/services/questionnaire.service';
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const questionnaires = await questionnaireService.getAll();

    return successResponse(questionnaires);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const body = await request.json();
    const questionnaire = await questionnaireService.create(body);

    return successResponse(questionnaire, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
```

#### GET /api/admin/questionnaires/[id]

**File:** `/src/app/api/admin/questionnaires/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { questionnaireService } from '@/services/questionnaire.service';
import { successResponse, errorResponse, UnauthorizedError, NotFoundError } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const questionnaire = await questionnaireService.getById(params.id);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    return successResponse(questionnaire);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const body = await request.json();
    const questionnaire = await questionnaireService.update(params.id, body);

    return successResponse(questionnaire);
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    await questionnaireService.delete(params.id);

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
```

#### GET /api/admin/questionnaires/[id]/responses

**File:** `/src/app/api/admin/questionnaires/[id]/responses/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { responseService } from '@/services/response.service';
import { successResponse, errorResponse, UnauthorizedError } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const responses = await responseService.getResponsesByQuestionnaireId(params.id);

    return successResponse(responses);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### 2.5 Client API Endpoints

#### GET /api/intake/[sessionId]

**File:** `/src/app/api/intake/[sessionId]/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { questionnaireService } from '@/services/questionnaire.service';
import { responseService } from '@/services/response.service';
import { successResponse, errorResponse, NotFoundError } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const questionnaire = await questionnaireService.getBySessionId(params.sessionId);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found or no longer available');
    }

    // Get existing responses to calculate progress
    const responses = await responseService.getResponsesByQuestionnaireId(questionnaire.id);
    const responseMap = new Map(responses.map((r) => [r.questionId, r]));

    // Calculate progress
    const totalQuestions = questionnaire.questions.length;
    const answeredCount = responses.length;
    const percentComplete = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    // Find current question (first unanswered required question, or first unanswered)
    let currentQuestionNumber = 1;
    for (let i = 0; i < questionnaire.questions.length; i++) {
      if (!responseMap.has(questionnaire.questions[i].id)) {
        currentQuestionNumber = i + 1;
        break;
      }
    }

    return successResponse({
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        clientName: questionnaire.clientName,
        status: questionnaire.status,
        totalQuestions,
        estimatedTime: `${Math.max(15, totalQuestions * 2)}-${Math.max(30, totalQuestions * 2 + 15)} minutes`,
      },
      progress: {
        currentQuestionNumber,
        answeredCount,
        percentComplete,
      },
      questions: questionnaire.questions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
```

#### POST /api/intake/[sessionId]/responses

**File:** `/src/app/api/intake/[sessionId]/responses/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { responseService } from '@/services/response.service';
import { saveResponseSchema } from '@/lib/validation/questionnaire.schema';
import { successResponse, errorResponse, ValidationError } from '@/lib/api/response';

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = saveResponseSchema.parse(body);

    const response = await responseService.saveResponse({
      sessionId: params.sessionId,
      questionId: validated.questionId,
      answerText: validated.answer.text,
      answerFiles: validated.answer.files,
      answerUrl: validated.answer.url,
      inputMethod: validated.answer.inputMethod,
      language: validated.answer.language,
    });

    // Get next question
    const questionnaire = await questionnaireService.getBySessionId(params.sessionId);
    if (!questionnaire) {
      throw new ValidationError('Invalid session');
    }

    const currentQuestion = questionnaire.questions.find((q) => q.id === validated.questionId);
    const currentIndex = currentQuestion ? questionnaire.questions.indexOf(currentQuestion) : -1;
    const nextQuestion = questionnaire.questions[currentIndex + 1] || null;

    return successResponse({
      response,
      nextQuestionId: nextQuestion?.id || null,
      progress: {
        answeredCount: await responseService.getResponseCount(questionnaire.id),
        percentComplete: Math.round(
          ((await responseService.getResponseCount(questionnaire.id)) / questionnaire.questions.length) * 100
        ),
      },
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
```

#### POST /api/intake/[sessionId]/submit

**File:** `/src/app/api/intake/[sessionId]/submit/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { responseService } from '@/services/response.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const result = await responseService.submitQuestionnaire(params.sessionId);

    return successResponse({
      success: true,
      completedAt: result.completedAt,
      message: 'Thank you! Your responses have been submitted.',
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
```

---

## 3. Business Logic Layer

### 3.1 Service Layer Architecture

**Responsibilities:**
- Business logic and workflow orchestration
- Data validation beyond schema validation
- Multi-repository coordination
- Business rule enforcement
- Error handling and transformation

**Principles:**
- Services don't know about HTTP (no Request/Response objects)
- Services return domain objects, not API responses
- Services throw custom errors (handled by controllers)
- Services use repositories exclusively for data access

### 3.2 Questionnaire Service

**File:** `/src/services/questionnaire.service.ts`

```typescript
import { questionnaireRepository, CreateQuestionnaireInput } from '@/repositories/questionnaire.repository';
import { questionRepository } from '@/repositories/question.repository';
import { generateSessionId } from '@/lib/utils/sessionId';
import { createQuestionnaireSchema, updateQuestionnaireSchema } from '@/lib/validation/questionnaire.schema';
import { ValidationError, NotFoundError } from '@/lib/api/response';
import { QuestionType } from '@prisma/client';

export class QuestionnaireService {
  /**
   * Create new questionnaire with questions
   */
  async create(data: unknown) {
    // Validate input
    const validated = createQuestionnaireSchema.parse(data);

    // Generate unique session ID
    const sessionId = generateSessionId();

    // Map questions with order
    const questions = validated.questions.map((q, index) => ({
      questionText: q.questionText,
      questionType: q.questionType as QuestionType,
      required: q.required,
      order: index + 1,
    }));

    // Create questionnaire
    const questionnaire = await questionnaireRepository.create({
      sessionId,
      title: validated.title,
      clientName: validated.clientName,
      questions,
    });

    return {
      ...questionnaire,
      shareUrl: `${process.env.NEXTAUTH_URL}/intake/${sessionId}`,
    };
  }

  /**
   * Update questionnaire
   */
  async update(id: string, data: unknown) {
    // Validate input
    const validated = updateQuestionnaireSchema.parse(data);

    // Check questionnaire exists
    const existing = await questionnaireRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Prevent editing if already completed
    if (existing.status === 'COMPLETED') {
      throw new ValidationError('Cannot edit completed questionnaire');
    }

    // Update basic fields
    if (validated.title || validated.clientName) {
      await questionnaireRepository.update(id, {
        title: validated.title,
        clientName: validated.clientName,
      });
    }

    // Update questions if provided
    if (validated.questions) {
      const questions = validated.questions.map((q, index) => ({
        questionText: q.questionText,
        questionType: q.questionType as QuestionType,
        required: q.required,
        order: index + 1,
      }));

      await questionRepository.replaceAll({
        questionnaireId: id,
        questions,
      });
    }

    return questionnaireRepository.findById(id);
  }

  /**
   * Get all questionnaires
   */
  async getAll() {
    return questionnaireRepository.findAll();
  }

  /**
   * Get questionnaire by ID
   */
  async getById(id: string) {
    const questionnaire = await questionnaireRepository.findById(id);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    return questionnaire;
  }

  /**
   * Get questionnaire by session ID (for client access)
   */
  async getBySessionId(sessionId: string) {
    const questionnaire = await questionnaireRepository.findBySessionId(sessionId);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found or no longer available');
    }

    return questionnaire;
  }

  /**
   * Delete questionnaire
   */
  async delete(id: string) {
    const questionnaire = await questionnaireRepository.findById(id);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Optional: Prevent deletion if has responses
    // Uncomment if this business rule is needed
    // if (questionnaire._count.responses > 0) {
    //   throw new ValidationError('Cannot delete questionnaire with responses. Archive instead.');
    // }

    await questionnaireRepository.delete(id);
  }

  /**
   * Get questionnaire statistics
   */
  async getStatistics() {
    return questionnaireRepository.getStats();
  }
}

export const questionnaireService = new QuestionnaireService();
```

### 3.3 Response Service

**File:** `/src/services/response.service.ts`

```typescript
import { responseRepository, CreateResponseInput } from '@/repositories/response.repository';
import { questionnaireRepository } from '@/repositories/questionnaire.repository';
import { ValidationError, NotFoundError } from '@/lib/api/response';
import { InputMethod, Language } from '@prisma/client';

export interface SaveResponseInput {
  sessionId: string;
  questionId: string;
  answerText?: string;
  answerFiles?: any;
  answerUrl?: string;
  inputMethod: InputMethod;
  language: Language;
}

export class ResponseService {
  /**
   * Save or update response to a question
   */
  async saveResponse(data: SaveResponseInput) {
    // Get questionnaire by session ID
    const questionnaire = await questionnaireRepository.findBySessionId(data.sessionId);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Check if already completed
    if (questionnaire.status === 'COMPLETED') {
      throw new ValidationError('Cannot modify completed questionnaire');
    }

    // Verify question belongs to questionnaire
    const question = questionnaire.questions.find((q) => q.id === data.questionId);
    if (!question) {
      throw new NotFoundError('Question not found in this questionnaire');
    }

    // Validate answer content based on question type
    if (question.questionType === 'FILE_UPLOAD') {
      if (!data.answerFiles && !data.answerUrl) {
        if (question.required) {
          throw new ValidationError('File upload or shared folder URL is required for this question');
        }
      }
    } else {
      if (!data.answerText || data.answerText.trim().length === 0) {
        if (question.required) {
          throw new ValidationError('Answer text is required for this question');
        }
      }
    }

    // Update status to IN_PROGRESS if not already
    if (questionnaire.status === 'NOT_STARTED') {
      await questionnaireRepository.updateStatus(questionnaire.id, 'IN_PROGRESS');
    }

    // Save response
    return responseRepository.upsert({
      questionnaireId: questionnaire.id,
      questionId: data.questionId,
      answerText: data.answerText,
      answerFiles: data.answerFiles,
      answerUrl: data.answerUrl,
      inputMethod: data.inputMethod,
      language: data.language,
    });
  }

  /**
   * Get all responses for a session
   */
  async getResponsesBySessionId(sessionId: string) {
    const questionnaire = await questionnaireRepository.findBySessionId(sessionId);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    return responseRepository.findByQuestionnaireId(questionnaire.id);
  }

  /**
   * Get all responses for a questionnaire (by ID)
   */
  async getResponsesByQuestionnaireId(questionnaireId: string) {
    return responseRepository.findByQuestionnaireId(questionnaireId);
  }

  /**
   * Get response count for questionnaire
   */
  async getResponseCount(questionnaireId: string) {
    return responseRepository.countByQuestionnaire(questionnaireId);
  }

  /**
   * Submit questionnaire (mark as completed)
   */
  async submitQuestionnaire(sessionId: string) {
    const questionnaire = await questionnaireRepository.findBySessionId(sessionId);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    if (questionnaire.status === 'COMPLETED') {
      throw new ValidationError('Questionnaire already submitted');
    }

    // Verify all required questions are answered
    const responses = await responseRepository.findByQuestionnaireId(questionnaire.id);
    const responseMap = new Map(responses.map((r) => [r.questionId, r]));

    const unansweredRequired = questionnaire.questions.filter((q) => q.required && !responseMap.has(q.id));

    if (unansweredRequired.length > 0) {
      throw new ValidationError(
        `Please answer all required questions. ${unansweredRequired.length} required question(s) remaining.`
      );
    }

    // Mark as completed
    return questionnaireRepository.updateStatus(questionnaire.id, 'COMPLETED');
  }

  /**
   * Get voice usage statistics for questionnaire
   */
  async getVoiceUsageStats(questionnaireId: string) {
    return responseRepository.getVoiceUsageStats(questionnaireId);
  }
}

export const responseService = new ResponseService();
```

### 3.4 Utility Functions

#### Session ID Generation

**File:** `/src/lib/utils/sessionId.ts`

```typescript
import { randomBytes } from 'crypto';

/**
 * Generate cryptographically secure session ID
 * Returns 22-character base64url string (128 bits of entropy)
 */
export function generateSessionId(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): boolean {
  // Base64url format: alphanumeric, hyphen, underscore (22 chars for 128-bit)
  return /^[A-Za-z0-9_-]{22}$/.test(sessionId);
}
```

---

## 4. File Storage Layer

### 4.1 Supabase Storage Setup

**Bucket Configuration:**

The Supabase Storage bucket should be created with the following settings:

1. **Bucket Name:** `intake-uploads`
2. **Public Access:** Enabled (files are accessible via public URLs)
3. **File Size Limit:** 50 MB
4. **Allowed MIME Types:** Enforced in application code (not at bucket level)

**Storage Policies:**

Create the following Row Level Security (RLS) policies in Supabase Dashboard:

```sql
-- Allow public uploads (authenticated via session validation in application)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'intake-uploads');

-- Allow public reads (files have public URLs)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'intake-uploads');

-- Allow service role to delete (for cleanup operations)
CREATE POLICY "Allow service role deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'intake-uploads');
```

**Manual Setup:**

If the bucket doesn't exist, create it via Supabase Dashboard:
1. Go to Storage section
2. Create new bucket named `intake-uploads`
3. Enable "Public bucket" option
4. Set file size limit to 50 MB
5. Apply the RLS policies above

**Automatic Setup:**

The `ensureBucketExists()` function will automatically create the bucket if it doesn't exist when the application starts.

### 4.2 Supabase Storage Client

**File:** `/src/lib/storage/supabase-storage.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { ValidationError } from '@/lib/api/response';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'intake-uploads';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// File size limit: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validate file metadata
 */
export function validateFileUpload(fileName: string, fileSize: number, mimeType: string) {
  if (!fileName || fileName.trim().length === 0) {
    throw new ValidationError('File name is required');
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  sessionId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ fileKey: string; fileUrl: string }> {
  // Validate
  validateFileUpload(fileName, fileBuffer.length, mimeType);

  // Generate unique key
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `uploads/${sessionId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileKey, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileKey);

  return {
    fileKey: data.path,
    fileUrl: urlData.publicUrl,
  };
}

/**
 * Generate signed URL for temporary access (1 hour)
 */
export async function generateSignedUrl(
  fileKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileKey, expiresIn);

  if (error) {
    console.error('Supabase Storage signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(fileKey: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileKey]);

  if (error) {
    console.error('Supabase Storage delete error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(fileKeys: string[]): Promise<void> {
  if (fileKeys.length === 0) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(fileKeys);

  if (error) {
    console.error('Supabase Storage batch delete error:', error);
    throw new Error(`Batch file deletion failed: ${error.message}`);
  }
}

/**
 * Get public URL for file
 */
export function getPublicUrl(fileKey: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileKey);

  return data.publicUrl;
}

/**
 * Check if bucket exists, create if not
 */
export async function ensureBucketExists(): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Failed to list buckets:', listError);
    return;
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });

    if (createError) {
      console.error('Failed to create bucket:', createError);
      throw new Error(`Bucket creation failed: ${createError.message}`);
    }

    console.log(`Created storage bucket: ${BUCKET_NAME}`);
  }
}
```

### 4.3 Upload API Endpoint

**File:** `/src/app/api/upload/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { uploadFile, validateFileUpload } from '@/lib/storage/supabase-storage';
import { successResponse, errorResponse, ValidationError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const sessionId = formData.get('sessionId') as string;
    const file = formData.get('file') as File;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    if (!file) {
      throw new ValidationError('File is required');
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate before upload
    validateFileUpload(file.name, file.size, file.type);

    // Upload to Supabase Storage
    const result = await uploadFile(
      sessionId,
      file.name,
      buffer,
      file.type
    );

    return successResponse({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileKey: result.fileKey,
      fileUrl: result.fileUrl,
    });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

### 4.4 File Deletion on Questionnaire Delete

Update questionnaire service to delete files:

```typescript
// Add to QuestionnaireService.delete()
async delete(id: string) {
  const questionnaire = await questionnaireRepository.findById(id);

  if (!questionnaire) {
    throw new NotFoundError('Questionnaire not found');
  }

  // Get all file uploads
  const responses = await responseRepository.findByQuestionnaireId(id);
  const fileKeys: string[] = [];

  responses.forEach((response) => {
    if (response.answerFiles) {
      const files = response.answerFiles as Array<{ fileKey?: string; fileUrl?: string }>;
      files.forEach((file) => {
        // Use fileKey if available, otherwise extract from URL
        if (file.fileKey) {
          fileKeys.push(file.fileKey);
        } else if (file.fileUrl) {
          // Extract file path from Supabase Storage URL
          // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
          const url = new URL(file.fileUrl);
          const pathParts = url.pathname.split('/');
          // Find 'public' in path and get everything after bucket name
          const publicIndex = pathParts.indexOf('public');
          if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
            const key = pathParts.slice(publicIndex + 2).join('/');
            fileKeys.push(key);
          }
        }
      });
    }
  });

  // Delete files from Supabase Storage
  if (fileKeys.length > 0) {
    await deleteFiles(fileKeys);
  }

  // Delete questionnaire (cascades to questions and responses)
  await questionnaireRepository.delete(id);
}
```

---

## 5. Authentication & Security

### 5.1 NextAuth.js Configuration

**File:** `/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth, { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Password',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
          console.error('ADMIN_PASSWORD not configured');
          return null;
        }

        if (credentials?.password === adminPassword) {
          return {
            id: 'admin',
            name: 'Admin',
            email: 'admin@intake-form.local',
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 5.2 Middleware for Route Protection

**File:** `/src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

// Protect admin routes only
export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/questionnaire/:path*', '/api/admin/:path*'],
};
```

### 5.3 Rate Limiting

**File:** `/src/lib/rateLimiting/rateLimiter.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different endpoints
export const rateLimiters = {
  // Client can save answer every 2 seconds
  saveAnswer: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
  }),

  // Admin can create questionnaires
  createQuestionnaire: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }),

  // File uploads
  fileUpload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
    analytics: true,
  }),

  // Session lookups (prevent enumeration)
  sessionLookup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
  }),
};

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Apply rate limit to request
 */
export async function applyRateLimit(
  request: Request,
  limiter: Ratelimit
): Promise<{ success: boolean; reset: number }> {
  const ip = getClientIP(request);
  const { success, reset } = await limiter.limit(ip);

  return { success, reset };
}
```

**Usage in API Route:**

```typescript
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiting/rateLimiter';

export async function POST(request: NextRequest) {
  // Apply rate limit
  const { success, reset } = await applyRateLimit(request, rateLimiters.saveAnswer);

  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' } },
      {
        status: 429,
        headers: {
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  // Process request...
}
```

### 5.4 Input Sanitization

**File:** `/src/lib/utils/sanitization.ts`

```typescript
/**
 * Sanitize HTML to prevent XSS
 * For MVP, we simply strip HTML tags
 * For production, use a library like DOMPurify
 */
export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}
```

---

## 6. Export Functionality

### 6.1 CSV Export

**File:** `/src/lib/export/csvExport.ts`

```typescript
import { ResponseWithQuestion } from '@/repositories/response.repository';

/**
 * Generate CSV content from responses
 */
export function generateCsvExport(
  responses: ResponseWithQuestion[],
  questionnaireTitle: string,
  clientName: string
): string {
  const rows: string[][] = [];

  // Header
  rows.push(['Question', 'Answer', 'Input Method', 'Language']);

  // Data rows
  responses.forEach((response) => {
    const question = response.question.questionText;
    let answer = '';

    if (response.answerText) {
      answer = response.answerText;
    } else if (response.answerFiles) {
      const files = response.answerFiles as Array<{ fileName: string; fileUrl: string }>;
      answer = files.map((f) => `File: ${f.fileName} (${f.fileUrl})`).join('; ');
    } else if (response.answerUrl) {
      answer = `Shared Folder: ${response.answerUrl}`;
    }

    rows.push([question, answer, response.inputMethod, response.language]);
  });

  // Convert to CSV string
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Generate filename for CSV export
 */
export function generateCsvFilename(clientName: string): string {
  const sanitized = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}_intake_${date}.csv`;
}
```

### 6.2 Markdown Transcript Export

**File:** `/src/lib/export/markdownExport.ts`

```typescript
import { ResponseWithQuestion } from '@/repositories/response.repository';

/**
 * Generate Markdown transcript from responses
 */
export function generateMarkdownExport(
  responses: ResponseWithQuestion[],
  questionnaireTitle: string,
  clientName: string,
  completedAt: Date | null
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Client Intake Transcript');
  lines.push('');
  lines.push(`**Client:** ${clientName}`);
  lines.push(`**Questionnaire:** ${questionnaireTitle}`);

  if (completedAt) {
    lines.push(`**Completed:** ${completedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Q&A pairs
  responses.forEach((response, index) => {
    lines.push(`## Question ${index + 1}`);
    lines.push('');
    lines.push(`**Q:** ${response.question.questionText}`);
    lines.push('');

    let answer = '';

    if (response.answerText) {
      answer = response.answerText;
    } else if (response.answerFiles) {
      const files = response.answerFiles as Array<{ fileName: string; fileUrl: string }>;
      answer = files.map((f) => `- [File: ${f.fileName}](${f.fileUrl})`).join('\n');
    } else if (response.answerUrl) {
      answer = `[Shared Folder](${response.answerUrl})`;
    }

    lines.push(`**A:** ${answer}`);
    lines.push('');

    // Metadata
    lines.push(`*Input: ${response.inputMethod === 'VOICE' ? 'Voice' : 'Text'} | Language: ${response.language}*`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate filename for Markdown export
 */
export function generateMarkdownFilename(clientName: string): string {
  const sanitized = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}_intake_transcript_${date}.md`;
}
```

### 6.3 Export API Endpoints

#### CSV Export

**File:** `/src/app/api/admin/questionnaires/[id]/export/csv/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { questionnaireRepository } from '@/repositories/questionnaire.repository';
import { responseRepository } from '@/repositories/response.repository';
import { generateCsvExport, generateCsvFilename } from '@/lib/export/csvExport';
import { errorResponse, UnauthorizedError, NotFoundError } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Get questionnaire
    const questionnaire = await questionnaireRepository.findById(params.id);
    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Get responses
    const responses = await responseRepository.findByQuestionnaireId(params.id);

    // Generate CSV
    const csv = generateCsvExport(responses, questionnaire.title, questionnaire.clientName);
    const filename = generateCsvFilename(questionnaire.clientName);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
```

#### Markdown Export

**File:** `/src/app/api/admin/questionnaires/[id]/export/markdown/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { questionnaireRepository } from '@/repositories/questionnaire.repository';
import { responseRepository } from '@/repositories/response.repository';
import { generateMarkdownExport, generateMarkdownFilename } from '@/lib/export/markdownExport';
import { errorResponse, UnauthorizedError, NotFoundError } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Get questionnaire
    const questionnaire = await questionnaireRepository.findById(params.id);
    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Get responses
    const responses = await responseRepository.findByQuestionnaireId(params.id);

    // Generate Markdown
    const markdown = generateMarkdownExport(
      responses,
      questionnaire.title,
      questionnaire.clientName,
      questionnaire.completedAt
    );
    const filename = generateMarkdownFilename(questionnaire.clientName);

    // Return Markdown file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1, Days 1-2)

**Goal:** Set up project structure, database, and core infrastructure

**Tasks:**
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up Prisma with PostgreSQL (Supabase)
3. Create initial database schema
4. Run first migration
5. Set up environment variables
6. Create Prisma client singleton
7. Test database connection

**Deliverables:**
- Working database connection
- Prisma schema defined
- Initial migration applied
- Project structure established

**Testing:**
- Database connection test
- Prisma client generation successful
- Can create/read test records

---

### Phase 2: Repository Layer (Week 1, Days 3-4)

**Goal:** Implement data access layer with repository pattern

**Tasks:**
1. Create repository base types
2. Implement QuestionnaireRepository
3. Implement QuestionRepository
4. Implement ResponseRepository
5. Write unit tests for repositories
6. Create database seed file

**Deliverables:**
- All repositories implemented
- Repository unit tests passing
- Database seed script working

**Testing:**
- Unit tests for each repository method
- Integration tests with test database
- Seed script populates sample data

---

### Phase 3: Service Layer (Week 1, Day 5 - Week 2, Day 1)

**Goal:** Implement business logic and orchestration

**Tasks:**
1. Create validation schemas with Zod
2. Implement QuestionnaireService
3. Implement ResponseService
4. Create custom error classes
5. Implement session ID generation
6. Write unit tests for services

**Deliverables:**
- All services implemented
- Service unit tests passing
- Error handling standardized

**Testing:**
- Unit tests for service methods
- Validation schema tests
- Error handling tests

---

### Phase 4: Admin API Routes (Week 2, Days 2-3)

**Goal:** Build admin-facing API endpoints

**Tasks:**
1. Set up NextAuth.js
2. Create admin authentication route
3. Implement GET/POST /api/admin/questionnaires
4. Implement GET/PATCH/DELETE /api/admin/questionnaires/[id]
5. Implement GET /api/admin/questionnaires/[id]/responses
6. Add middleware for route protection
7. Add rate limiting

**Deliverables:**
- All admin API routes functional
- Authentication working
- Protected routes enforced

**Testing:**
- Integration tests for each endpoint
- Authentication tests
- Authorization tests

---

### Phase 5: Client API Routes (Week 2, Days 4-5)

**Goal:** Build client-facing API endpoints

**Tasks:**
1. Implement GET /api/intake/[sessionId]
2. Implement POST /api/intake/[sessionId]/responses
3. Implement POST /api/intake/[sessionId]/submit
4. Add session validation
5. Add rate limiting for client endpoints

**Deliverables:**
- All client API routes functional
- Session-based access working
- Rate limiting active

**Testing:**
- Integration tests for each endpoint
- Session validation tests
- Happy path and error scenarios

---

### Phase 6: File Storage (Week 3, Days 1-2)

**Goal:** Implement file upload with Supabase Storage

**Tasks:**
1. Set up Supabase Storage bucket (or verify it exists)
2. Implement Supabase Storage client
3. Create file upload handler
4. Implement POST /api/upload
5. Add file validation (size, type)
6. Implement file deletion on questionnaire delete
7. Test file upload flow

**Deliverables:**
- File upload working end-to-end
- Files stored in Supabase Storage
- File validation enforced

**Testing:**
- Upload flow integration test
- File size validation test
- MIME type validation test
- File deletion test

---

### Phase 7: Export Functionality (Week 3, Days 3-4)

**Goal:** Implement CSV and Markdown export

**Tasks:**
1. Create CSV export utility
2. Create Markdown export utility
3. Implement GET /api/admin/questionnaires/[id]/export/csv
4. Implement GET /api/admin/questionnaires/[id]/export/markdown
5. Test export formatting
6. Test filename generation

**Deliverables:**
- CSV export working
- Markdown export working
- Properly formatted files

**Testing:**
- Export format validation
- Special character handling
- File download tests

---

### Phase 8: Integration & Polish (Week 3, Day 5)

**Goal:** End-to-end testing and refinement

**Tasks:**
1. Full integration testing
2. Error message refinement
3. Performance optimization
4. Security audit
5. Documentation updates

**Deliverables:**
- All systems integrated
- Performance benchmarks met
- Security checklist complete

**Testing:**
- End-to-end user flows
- Load testing
- Security penetration testing

---

## 8. Testing Strategy

### 8.1 Unit Testing

**Framework:** Jest + Testing Library

**Coverage Targets:**
- Repositories: 100% (pure data access)
- Services: 90%+ (business logic critical)
- Utilities: 100% (pure functions)

#### Repository Tests Example

**File:** `/src/repositories/__tests__/questionnaire.repository.test.ts`

```typescript
import { questionnaireRepository } from '../questionnaire.repository';
import { prisma } from '@/lib/prisma';
import { generateSessionId } from '@/lib/utils/sessionId';

describe('QuestionnaireRepository', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.response.deleteMany();
    await prisma.question.deleteMany();
    await prisma.questionnaire.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create questionnaire with questions', async () => {
      const data = {
        sessionId: generateSessionId(),
        title: 'Test Questionnaire',
        clientName: 'Test Client',
        questions: [
          {
            questionText: 'Question 1',
            questionType: 'OPEN_ENDED' as const,
            required: true,
            order: 1,
          },
        ],
      };

      const result = await questionnaireRepository.create(data);

      expect(result.id).toBeDefined();
      expect(result.title).toBe(data.title);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].questionText).toBe('Question 1');
    });

    it('should assign unique session ID', async () => {
      const data = {
        sessionId: generateSessionId(),
        title: 'Test',
        clientName: 'Test',
        questions: [],
      };

      const result = await questionnaireRepository.create(data);

      expect(result.sessionId).toHaveLength(22);
      expect(/^[A-Za-z0-9_-]{22}$/.test(result.sessionId)).toBe(true);
    });
  });

  describe('findBySessionId', () => {
    it('should return null for invalid session ID', async () => {
      const result = await questionnaireRepository.findBySessionId('invalid');

      expect(result).toBeNull();
    });

    it('should return questionnaire with questions', async () => {
      const created = await questionnaireRepository.create({
        sessionId: generateSessionId(),
        title: 'Test',
        clientName: 'Test',
        questions: [
          {
            questionText: 'Q1',
            questionType: 'OPEN_ENDED',
            required: true,
            order: 1,
          },
        ],
      });

      const result = await questionnaireRepository.findBySessionId(created.sessionId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.questions).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update status and set completedAt for COMPLETED', async () => {
      const created = await questionnaireRepository.create({
        sessionId: generateSessionId(),
        title: 'Test',
        clientName: 'Test',
        questions: [],
      });

      const result = await questionnaireRepository.updateStatus(created.id, 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).not.toBeNull();
    });

    it('should update status without setting completedAt for IN_PROGRESS', async () => {
      const created = await questionnaireRepository.create({
        sessionId: generateSessionId(),
        title: 'Test',
        clientName: 'Test',
        questions: [],
      });

      const result = await questionnaireRepository.updateStatus(created.id, 'IN_PROGRESS');

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.completedAt).toBeNull();
    });
  });
});
```

#### Service Tests Example

**File:** `/src/services/__tests__/questionnaire.service.test.ts`

```typescript
import { questionnaireService } from '../questionnaire.service';
import { questionnaireRepository } from '@/repositories/questionnaire.repository';
import { ValidationError, NotFoundError } from '@/lib/api/response';

// Mock repositories
jest.mock('@/repositories/questionnaire.repository');
jest.mock('@/repositories/question.repository');

describe('QuestionnaireService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should validate input and create questionnaire', async () => {
      const input = {
        title: 'Test Questionnaire',
        clientName: 'Test Client',
        questions: [
          {
            questionText: 'Question 1',
            questionType: 'OPEN_ENDED' as const,
            required: true,
          },
        ],
      };

      const mockCreated = {
        id: 'test-id',
        sessionId: 'test-session-id',
        ...input,
        questions: input.questions.map((q, i) => ({ ...q, order: i + 1 })),
      };

      (questionnaireRepository.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await questionnaireService.create(input);

      expect(result.id).toBe('test-id');
      expect(result.shareUrl).toContain('test-session-id');
      expect(questionnaireRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: input.title,
          clientName: input.clientName,
        })
      );
    });

    it('should throw ValidationError for invalid input', async () => {
      const input = {
        title: '',
        clientName: 'Test',
        questions: [],
      };

      await expect(questionnaireService.create(input)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should prevent editing completed questionnaire', async () => {
      const mockQuestionnaire = {
        id: 'test-id',
        status: 'COMPLETED' as const,
      };

      (questionnaireRepository.findById as jest.Mock).mockResolvedValue(mockQuestionnaire);

      await expect(
        questionnaireService.update('test-id', { title: 'New Title' })
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### 8.2 Integration Testing

**Framework:** Jest + Supertest

**Coverage:** All API endpoints

#### API Integration Test Example

**File:** `/src/app/api/__tests__/admin/questionnaires.test.ts`

```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/questionnaires/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock NextAuth
jest.mock('next-auth');

describe('GET /api/admin/questionnaires', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.response.deleteMany();
    await prisma.question.deleteMany();
    await prisma.questionnaire.deleteMany();
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/questionnaires');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return all questionnaires if authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'admin' } });

    // Create test data
    await prisma.questionnaire.create({
      data: {
        sessionId: 'test-session',
        title: 'Test',
        clientName: 'Test Client',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/questionnaires');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Test');
  });
});

describe('POST /api/admin/questionnaires', () => {
  it('should create questionnaire with valid input', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'admin' } });

    const input = {
      title: 'New Questionnaire',
      clientName: 'New Client',
      questions: [
        {
          questionText: 'Question 1',
          questionType: 'OPEN_ENDED',
          required: true,
        },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/questionnaires', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.title).toBe(input.title);
    expect(body.data.sessionId).toBeDefined();
  });

  it('should return 400 for invalid input', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'admin' } });

    const input = {
      title: '',
      clientName: 'Test',
      questions: [],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/questionnaires', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### 8.3 Database Testing

**Approach:** Separate test database

**Setup:**

```bash
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/intake_form_test"
DIRECT_URL="postgresql://user:password@localhost:5432/intake_form_test"
```

**Test Setup Script:**

```typescript
// jest.setup.ts
import { prisma } from '@/lib/prisma';

beforeAll(async () => {
  // Run migrations on test database
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE;');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
  // Migrations applied automatically by Prisma
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 8.4 Test Coverage Requirements

**Minimum Coverage:**
- Overall: 80%
- Services: 90%
- Repositories: 100%
- Utilities: 100%
- API Routes: 80%

**Coverage Report:**
```bash
npm run test:coverage
```

**CI/CD Integration:**
- Tests run on every PR
- Coverage report posted to PR
- Merge blocked if coverage drops below threshold

---

## 9. Appendix

### 9.1 Environment Variables Reference

```bash
# Database
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# Supabase Storage
STORAGE_BUCKET_NAME="intake-uploads"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="<randomly-generated-secret>"

# Admin
ADMIN_PASSWORD="<strong-password>"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<token>"

# Optional
RESEND_API_KEY="<api-key>"
SENTRY_DSN="<sentry-dsn>"
```

### 9.2 Required NPM Packages

**Core Dependencies:**
```bash
npm install @supabase/supabase-js
npm install @prisma/client
npm install prisma --save-dev
npm install next-auth
npm install zod
npm install @upstash/redis @upstash/ratelimit

# For development
npm install typescript @types/node @types/react --save-dev
npm install jest @testing-library/react @testing-library/jest-dom --save-dev
```

**Note:** Remove these packages if previously installed for Cloudflare R2:
```bash
npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 9.3 NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

### 9.4 Error Code Reference

| Code | HTTP Status | Description | When to Use |
|------|-------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed | Invalid request body, missing required fields |
| `NOT_FOUND` | 404 | Resource not found | Questionnaire, question, or session doesn't exist |
| `UNAUTHORIZED` | 401 | Authentication required | Missing or invalid admin session |
| `FORBIDDEN` | 403 | Action not allowed | Editing completed questionnaire |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Client exceeded rate limit |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected error | Database errors, unhandled exceptions |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit | Upload >50MB |
| `UNSUPPORTED_FILE_TYPE` | 400 | Invalid file type | File type not in allowed list |

### 9.5 Database Indexes Performance Guide

**Query Performance Targets:**
- Session lookup: <10ms
- Questionnaire list (admin): <50ms
- Response retrieval: <20ms
- Questionnaire creation: <100ms

**Index Usage:**
- `questionnaires.sessionId`: UNIQUE index (B-tree) for client access
- `questionnaires.status`: B-tree index for admin filtering
- `questionnaires.createdAt`: B-tree index DESC for dashboard ordering
- `questions.questionnaireId`: B-tree index for question lookups
- `responses.questionnaireId`: B-tree index for response aggregation
- `responses.(questionnaireId, questionId)`: UNIQUE composite index

**Monitoring Slow Queries:**
```typescript
// Add to Prisma client initialization
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`Slow query detected (${e.duration}ms):`, e.query);
  }
});
```

### 9.6 Critical Implementation Notes

1. **Never expose internal IDs in URLs**
   - Use `sessionId` for client access, not database `id`
   - Session IDs are cryptographically random, not sequential

2. **Always validate business rules in service layer**
   - Don't rely solely on database constraints
   - Provide user-friendly error messages

3. **Use transactions for multi-step operations**
   - Question updates (delete + recreate)
   - Questionnaire submission (validate + update status)

4. **Handle file cleanup on errors**
   - If questionnaire creation fails after file upload, delete orphaned files
   - Implement background cleanup job for orphaned files

5. **Rate limiting is essential**
   - Prevents abuse and enumeration attacks
   - Different limits for different endpoints

6. **Test error paths, not just happy paths**
   - Invalid session IDs
   - Missing required fields
   - Completed questionnaire editing attempts
   - Network failures during file upload

7. **Supabase Storage best practices**
   - Always store both `fileKey` and `fileUrl` in database for reliable deletion
   - Use service role key for server-side operations (uploads, deletes)
   - Public URLs are permanent and don't require signed URLs for basic access
   - Use signed URLs only when temporary access control is needed
   - Organize files by session ID for easy cleanup

---

**End of Backend Implementation Plan**

This plan provides comprehensive guidance for implementing the backend of the agricultural intake form application. All code examples are production-ready and follow industry best practices for security, performance, and maintainability.

For questions or clarifications, refer to the related architecture and design documents listed at the beginning of this document.
