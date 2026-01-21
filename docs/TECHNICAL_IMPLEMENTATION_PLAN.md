# Technical Implementation Plan
## Agricultural Consulting Intake Form Web App

**Version:** 1.0
**Date:** January 2026
**Timeline:** 8 weeks (MVP)

---

## Overview

This document provides a comprehensive, step-by-step implementation plan for building the agricultural consulting intake form web application. The plan is organized into 12 phases, from initial setup through post-launch monitoring.

**Related Documents:**
- [Product Design Document](./PRODUCT_DESIGN_DOCUMENT.md)
- [Technical Architecture Specification](./TECHNICAL_ARCHITECTURE_SPECIFICATION.md)

**Technology Stack:**
- Frontend: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- Backend: Next.js API Routes (Node.js serverless)
- Database: PostgreSQL via Supabase
- File Storage: Supabase Storage (100GB included in Pro plan)
- Voice Input: Web Speech API
- Deployment: Vercel

---

## Implementation Phases

### Phase 1: Project Setup & Foundation
**Duration:** Week 1 (Days 1-2)
**Goal:** Initialize project with core tooling and structure

#### 1.1 Repository Initialization

**Tasks:**

1. **Initialize Git Repository** (Simple)
   ```bash
   mkdir intake-form
   cd intake-form
   git init
   echo "node_modules/" > .gitignore
   echo ".env.local" >> .gitignore
   echo ".next/" >> .gitignore
   ```
   - **Dependencies:** None
   - **Output:** Git repository initialized

2. **Create Next.js Project** (Simple)
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
   ```
   - Select options:
     - TypeScript: Yes
     - ESLint: Yes
     - Tailwind CSS: Yes
     - App Router: Yes
     - Import alias: `@/*`
   - **Dependencies:** Task 1.1.1 completed
   - **Output:** Next.js 14 project scaffolded

3. **Install Core Dependencies** (Simple)
   ```bash
   npm install @prisma/client @supabase/supabase-js
   npm install next-auth bcryptjs zod
   npm install -D prisma
   ```
   - **Dependencies:** Task 1.1.2 completed
   - **Output:** Core packages installed

#### 1.2 Project Structure Setup

**Tasks:**

1. **Create Directory Structure** (Simple)
   ```bash
   mkdir -p src/{components/{admin,client,ui},lib/{api,storage,utils},hooks,services,repositories,types}
   mkdir -p prisma
   mkdir -p public/assets
   ```
   - **Dependencies:** Task 1.1.2 completed
   - **Output:** Folder structure created

2. **Create TypeScript Configuration** (Simple)
   - Update `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "target": "ES2020",
         "lib": ["dom", "dom.iterable", "esnext"],
         "allowJs": true,
         "skipLibCheck": true,
         "strict": true,
         "noEmit": true,
         "esModuleInterop": true,
         "module": "esnext",
         "moduleResolution": "bundler",
         "resolveJsonModule": true,
         "isolatedModules": true,
         "jsx": "preserve",
         "incremental": true,
         "plugins": [{ "name": "next" }],
         "paths": {
           "@/*": ["./src/*"]
         }
       },
       "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
       "exclude": ["node_modules"]
     }
     ```
   - **Dependencies:** Task 1.2.1 completed
   - **File to modify:** `/tsconfig.json`

3. **Create Environment Variables Template** (Simple)
   - Create `.env.example`:
     ```
     # Database
     DATABASE_URL="postgresql://user:password@host:5432/database"
     DIRECT_URL="postgresql://user:password@host:5432/database"

     # NextAuth
     NEXTAUTH_URL="http://localhost:3000"
     NEXTAUTH_SECRET="your-secret-here"

     # Admin
     ADMIN_PASSWORD="your-admin-password"

     # Supabase Storage (uses existing Supabase credentials)
     STORAGE_BUCKET_NAME="intake-uploads"

     # Redis (Upstash)
     UPSTASH_REDIS_REST_URL="your-redis-url"
     UPSTASH_REDIS_REST_TOKEN="your-redis-token"

     # Optional
     RESEND_API_KEY="your-resend-key"
     SENTRY_DSN="your-sentry-dsn"
     NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
     ```
   - Copy to `.env.local` and fill in values
   - **Dependencies:** None
   - **File to create:** `/.env.example`

#### 1.3 UI Component Library Setup

**Tasks:**

1. **Install shadcn/ui** (Simple)
   ```bash
   npx shadcn-ui@latest init
   ```
   - Configuration:
     - Style: Default
     - Base color: Slate
     - CSS variables: Yes
   - **Dependencies:** Task 1.1.2 completed
   - **Output:** shadcn/ui configured with Tailwind

2. **Install Core UI Components** (Simple)
   ```bash
   npx shadcn-ui@latest add button card input textarea select
   npx shadcn-ui@latest add accordion alert dialog progress
   ```
   - **Dependencies:** Task 1.3.1 completed
   - **Output:** UI components available in `/src/components/ui/`

---

### Phase 2: Database & Infrastructure Setup
**Duration:** Week 1 (Days 3-5)
**Goal:** Set up database schema and external services

#### 2.1 Supabase Project Setup

**Tasks:**

1. **Create Supabase Project** (Simple)
   - Visit https://supabase.com/dashboard
   - Click "New Project"
   - Name: `intake-form-production`
   - Database password: Generate strong password
   - Region: Choose closest to target users
   - **Dependencies:** None
   - **Output:** Supabase project created with connection string

2. **Update Environment Variables** (Simple)
   - Copy connection strings from Supabase dashboard
   - Update `.env.local`:
     ```
     DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
     DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
     ```
   - **Dependencies:** Task 2.1.1 completed
   - **File to modify:** `/.env.local`

#### 2.2 Database Schema Implementation

**Tasks:**

1. **Initialize Prisma** (Simple)
   ```bash
   npx prisma init
   ```
   - **Dependencies:** Task 2.1.2 completed
   - **Output:** `prisma/schema.prisma` created

2. **Define Prisma Schema** (Medium)
   - Replace contents of `prisma/schema.prisma`:
     ```prisma
     generator client {
       provider = "prisma-client-js"
     }

     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
       directUrl = env("DIRECT_URL")
     }

     model Questionnaire {
       id            String    @id @default(cuid())
       sessionId     String    @unique
       title         String
       clientName    String
       status        QuestionnaireStatus @default(NOT_STARTED)
       createdAt     DateTime  @default(now())
       completedAt   DateTime?
       updatedAt     DateTime  @updatedAt

       questions     Question[]
       responses     Response[]

       @@index([sessionId])
       @@index([status])
     }

     model Question {
       id              String      @id @default(cuid())
       questionnaireId String
       questionText    String
       questionType    QuestionType
       required        Boolean     @default(true)
       order           Int
       createdAt       DateTime    @default(now())
       updatedAt       DateTime    @updatedAt

       questionnaire   Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
       responses       Response[]

       @@index([questionnaireId])
     }

     model Response {
       id              String      @id @default(cuid())
       questionnaireId String
       questionId      String
       answerText      String?
       answerFiles     Json?       // Array of {fileName: string, fileUrl: string, fileSize: number}
       answerUrl       String?
       inputMethod     InputMethod @default(TEXT)
       language        Language    @default(EN)
       createdAt       DateTime    @default(now())
       updatedAt       DateTime    @updatedAt

       questionnaire   Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
       question        Question      @relation(fields: [questionId], references: [id], onDelete: Cascade)

       @@unique([questionnaireId, questionId])
       @@index([questionnaireId])
     }

     enum QuestionnaireStatus {
       NOT_STARTED
       IN_PROGRESS
       COMPLETED
     }

     enum QuestionType {
       OPEN_ENDED
       SHORT_ANSWER
       FILE_UPLOAD
     }

     enum InputMethod {
       VOICE
       TEXT
     }

     enum Language {
       EN
       ES
     }
     ```
   - **Dependencies:** Task 2.2.1 completed
   - **File to modify:** `/prisma/schema.prisma`

3. **Run Database Migration** (Simple)
   ```bash
   npx prisma migrate dev --name init
   ```
   - **Dependencies:** Task 2.2.2 completed
   - **Output:** Database tables created

4. **Generate Prisma Client** (Simple)
   ```bash
   npx prisma generate
   ```
   - Add to `package.json` scripts:
     ```json
     {
       "scripts": {
         "postinstall": "prisma generate"
       }
     }
     ```
   - **Dependencies:** Task 2.2.3 completed
   - **Output:** Type-safe Prisma Client generated

#### 2.3 Supabase Storage Setup

**Tasks:**

1. **Create Supabase Storage Bucket** (Simple)
   - Visit Supabase dashboard → Storage
   - Create bucket: `intake-uploads`
   - Enable public access for uploads (set bucket policy to public)
   - Configure RLS policies if needed for additional security
   - **Dependencies:** Supabase project created (Task 2.1.1)
   - **Output:** Supabase Storage bucket configured and ready

2. **Update Environment Variables** (Simple)
   - Add storage bucket name to `.env.local`:
     ```
     STORAGE_BUCKET_NAME="intake-uploads"
     ```
   - Note: Supabase credentials already configured in Task 2.1.2
   - **Dependencies:** Task 2.3.1 completed
   - **File to modify:** `/.env.local`

---

### Phase 3: Core Backend Implementation
**Duration:** Week 2 (Days 1-5)
**Goal:** Build API routes and business logic layer

#### 3.1 Database Connection Setup

**Tasks:**

1. **Create Prisma Client Instance** (Simple)
   - Create `src/lib/prisma.ts`:
     ```typescript
     import { PrismaClient } from '@prisma/client';

     const globalForPrisma = globalThis as unknown as {
       prisma: PrismaClient | undefined;
     };

     export const prisma =
       globalForPrisma.prisma ??
       new PrismaClient({
         log: ['error'],
       });

     if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
     ```
   - **Dependencies:** Task 2.2.4 completed
   - **File to create:** `/src/lib/prisma.ts`

#### 3.2 Repository Pattern Implementation

**Tasks:**

1. **Create Base Repository Types** (Simple)
   - Create `src/types/repository.types.ts`:
     ```typescript
     export interface IRepository<T> {
       findById(id: string): Promise<T | null>;
       findAll(): Promise<T[]>;
       create(data: Partial<T>): Promise<T>;
       update(id: string, data: Partial<T>): Promise<T>;
       delete(id: string): Promise<void>;
     }
     ```
   - **Dependencies:** None
   - **File to create:** `/src/types/repository.types.ts`

2. **Create Questionnaire Repository** (Complex)
   - Create `src/repositories/questionnaire.repository.ts`:
     ```typescript
     import { prisma } from '@/lib/prisma';
     import { Questionnaire, Question, QuestionnaireStatus } from '@prisma/client';

     export class QuestionnaireRepository {
       async findById(id: string) {
         return prisma.questionnaire.findUnique({
           where: { id },
           include: {
             questions: {
               orderBy: { order: 'asc' },
             },
           },
         });
       }

       async findBySessionId(sessionId: string) {
         return prisma.questionnaire.findUnique({
           where: { sessionId },
           include: {
             questions: {
               orderBy: { order: 'asc' },
             },
           },
         });
       }

       async findAll() {
         return prisma.questionnaire.findMany({
           orderBy: { createdAt: 'desc' },
           include: {
             questions: true,
             _count: {
               select: { responses: true },
             },
           },
         });
       }

       async create(data: {
         sessionId: string;
         title: string;
         clientName: string;
         questions: Array<{
           questionText: string;
           questionType: string;
           required: boolean;
           order: number;
         }>;
       }) {
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
             questions: true,
           },
         });
       }

       async update(id: string, data: Partial<Questionnaire>) {
         return prisma.questionnaire.update({
           where: { id },
           data,
         });
       }

       async updateStatus(id: string, status: QuestionnaireStatus) {
         return prisma.questionnaire.update({
           where: { id },
           data: {
             status,
             ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
           },
         });
       }

       async delete(id: string) {
         await prisma.questionnaire.delete({
           where: { id },
         });
       }
     }

     export const questionnaireRepository = new QuestionnaireRepository();
     ```
   - **Dependencies:** Task 3.1.1 completed
   - **File to create:** `/src/repositories/questionnaire.repository.ts`

3. **Create Response Repository** (Medium)
   - Create `src/repositories/response.repository.ts`:
     ```typescript
     import { prisma } from '@/lib/prisma';
     import { Response, InputMethod, Language } from '@prisma/client';

     export class ResponseRepository {
       async findByQuestionnaireId(questionnaireId: string) {
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

       async findByQuestionId(questionnaireId: string, questionId: string) {
         return prisma.response.findUnique({
           where: {
             questionnaireId_questionId: {
               questionnaireId,
               questionId,
             },
           },
         });
       }

       async upsert(data: {
         questionnaireId: string;
         questionId: string;
         answerText?: string;
         answerFiles?: any;
         answerUrl?: string;
         inputMethod: InputMethod;
         language: Language;
       }) {
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

       async delete(questionnaireId: string, questionId: string) {
         await prisma.response.delete({
           where: {
             questionnaireId_questionId: {
               questionnaireId,
               questionId,
             },
           },
         });
       }
     }

     export const responseRepository = new ResponseRepository();
     ```
   - **Dependencies:** Task 3.1.1 completed
   - **File to create:** `/src/repositories/response.repository.ts`

#### 3.3 Service Layer Implementation

**Tasks:**

1. **Create Session ID Generator** (Simple)
   - Create `src/lib/utils/sessionId.ts`:
     ```typescript
     import { randomBytes } from 'crypto';

     export function generateSessionId(): string {
       // Generate 128-bit random ID, base64url encoded (22 characters)
       return randomBytes(16).toString('base64url');
     }

     export function validateSessionId(sessionId: string): boolean {
       // Check format: 22 alphanumeric characters
       return /^[A-Za-z0-9_-]{22}$/.test(sessionId);
     }
     ```
   - **Dependencies:** None
   - **File to create:** `/src/lib/utils/sessionId.ts`

2. **Create Questionnaire Service** (Complex)
   - Create `src/services/questionnaire.service.ts`:
     ```typescript
     import { questionnaireRepository } from '@/repositories/questionnaire.repository';
     import { generateSessionId } from '@/lib/utils/sessionId';
     import { QuestionType } from '@prisma/client';

     export class QuestionnaireService {
       async create(data: {
         title: string;
         clientName: string;
         questions: Array<{
           questionText: string;
           questionType: QuestionType;
           required: boolean;
         }>;
       }) {
         const sessionId = generateSessionId();

         const questionsWithOrder = data.questions.map((q, index) => ({
           ...q,
           order: index,
         }));

         return questionnaireRepository.create({
           sessionId,
           title: data.title,
           clientName: data.clientName,
           questions: questionsWithOrder,
         });
       }

       async update(id: string, data: {
         title?: string;
         clientName?: string;
         questions?: Array<{
           id?: string;
           questionText: string;
           questionType: QuestionType;
           required: boolean;
         }>;
       }) {
         // Update basic fields
         if (data.title || data.clientName) {
           await questionnaireRepository.update(id, {
             title: data.title,
             clientName: data.clientName,
           });
         }

         // Update questions if provided
         if (data.questions) {
           // For MVP, we'll delete and recreate questions
           // Future: implement proper update logic
           const questionnaire = await questionnaireRepository.findById(id);
           if (questionnaire) {
             await prisma.question.deleteMany({
               where: { questionnaireId: id },
             });

             await prisma.question.createMany({
               data: data.questions.map((q, index) => ({
                 questionnaireId: id,
                 questionText: q.questionText,
                 questionType: q.questionType,
                 required: q.required,
                 order: index,
               })),
             });
           }
         }

         return questionnaireRepository.findById(id);
       }

       async getAll() {
         return questionnaireRepository.findAll();
       }

       async getBySessionId(sessionId: string) {
         return questionnaireRepository.findBySessionId(sessionId);
       }

       async delete(id: string) {
         return questionnaireRepository.delete(id);
       }
     }

     export const questionnaireService = new QuestionnaireService();
     ```
   - **Dependencies:** Task 3.2.2, 3.3.1 completed
   - **File to create:** `/src/services/questionnaire.service.ts`

3. **Create Response Service** (Complex)
   - Create `src/services/response.service.ts`:
     ```typescript
     import { responseRepository } from '@/repositories/response.repository';
     import { questionnaireRepository } from '@/repositories/questionnaire.repository';
     import { InputMethod, Language } from '@prisma/client';

     export class ResponseService {
       async saveResponse(data: {
         sessionId: string;
         questionId: string;
         answerText?: string;
         answerFiles?: any;
         answerUrl?: string;
         inputMethod: InputMethod;
         language: Language;
       }) {
         // Get questionnaire by session ID
         const questionnaire = await questionnaireRepository.findBySessionId(data.sessionId);

         if (!questionnaire) {
           throw new Error('Questionnaire not found');
         }

         // Verify question belongs to questionnaire
         const question = questionnaire.questions.find(q => q.id === data.questionId);
         if (!question) {
           throw new Error('Question not found');
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

       async getResponses(sessionId: string) {
         const questionnaire = await questionnaireRepository.findBySessionId(sessionId);

         if (!questionnaire) {
           throw new Error('Questionnaire not found');
         }

         return responseRepository.findByQuestionnaireId(questionnaire.id);
       }

       async submitQuestionnaire(sessionId: string) {
         const questionnaire = await questionnaireRepository.findBySessionId(sessionId);

         if (!questionnaire) {
           throw new Error('Questionnaire not found');
         }

         // Verify all required questions are answered
         const responses = await responseRepository.findByQuestionnaireId(questionnaire.id);
         const responseMap = new Map(responses.map(r => [r.questionId, r]));

         const unansweredRequired = questionnaire.questions.filter(
           q => q.required && !responseMap.has(q.id)
         );

         if (unansweredRequired.length > 0) {
           throw new Error(`Please answer all required questions. ${unansweredRequired.length} remaining.`);
         }

         // Mark as completed
         return questionnaireRepository.updateStatus(questionnaire.id, 'COMPLETED');
       }
     }

     export const responseService = new ResponseService();
     ```
   - **Dependencies:** Task 3.2.2, 3.2.3 completed
   - **File to create:** `/src/services/response.service.ts`

#### 3.4 API Routes - Admin

**Tasks:**

1. **Create API Response Utilities** (Simple)
   - Create `src/lib/api/response.ts`:
     ```typescript
     import { NextResponse } from 'next/server';

     export function successResponse(data: any, status = 200) {
       return NextResponse.json({ data }, { status });
     }

     export function errorResponse(error: any, status?: number) {
       const message = error instanceof Error ? error.message : 'An error occurred';
       const statusCode = status || (error.statusCode ?? 500);

       return NextResponse.json(
         { error: { message } },
         { status: statusCode }
       );
     }
     ```
   - **Dependencies:** None
   - **File to create:** `/src/lib/api/response.ts`

2. **Create Validation Schemas** (Medium)
   - Create `src/lib/validation/questionnaire.schema.ts`:
     ```typescript
     import { z } from 'zod';

     export const createQuestionnaireSchema = z.object({
       title: z.string().min(1, 'Title is required').max(200),
       clientName: z.string().min(1, 'Client name is required').max(200),
       questions: z.array(
         z.object({
           questionText: z.string().min(1, 'Question text is required').max(500),
           questionType: z.enum(['OPEN_ENDED', 'SHORT_ANSWER', 'FILE_UPLOAD']),
           required: z.boolean(),
         })
       ).min(1, 'At least one question is required'),
     });

     export const saveResponseSchema = z.object({
       questionId: z.string().cuid(),
       answer: z.object({
         text: z.string().optional(),
         files: z.array(z.any()).optional(),
         url: z.string().url().optional(),
         inputMethod: z.enum(['VOICE', 'TEXT']),
         language: z.enum(['EN', 'ES']),
       }),
     });
     ```
   - **Dependencies:** None
   - **File to create:** `/src/lib/validation/questionnaire.schema.ts`

3. **Create Admin Questionnaire API** (Complex)
   - Create `src/app/api/admin/questionnaires/route.ts`:
     ```typescript
     import { NextRequest } from 'next/server';
     import { questionnaireService } from '@/services/questionnaire.service';
     import { createQuestionnaireSchema } from '@/lib/validation/questionnaire.schema';
     import { successResponse, errorResponse } from '@/lib/api/response';

     export async function GET() {
       try {
         const questionnaires = await questionnaireService.getAll();
         return successResponse(questionnaires);
       } catch (error) {
         return errorResponse(error);
       }
     }

     export async function POST(request: NextRequest) {
       try {
         const body = await request.json();
         const validated = createQuestionnaireSchema.parse(body);

         const questionnaire = await questionnaireService.create(validated);

         return successResponse(questionnaire, 201);
       } catch (error) {
         return errorResponse(error, 400);
       }
     }
     ```
   - **Dependencies:** Task 3.3.2, 3.4.1, 3.4.2 completed
   - **File to create:** `/src/app/api/admin/questionnaires/route.ts`

4. **Create Individual Questionnaire API** (Medium)
   - Create `src/app/api/admin/questionnaires/[id]/route.ts`:
     ```typescript
     import { NextRequest } from 'next/server';
     import { questionnaireService } from '@/services/questionnaire.service';
     import { successResponse, errorResponse } from '@/lib/api/response';

     export async function GET(
       request: NextRequest,
       { params }: { params: { id: string } }
     ) {
       try {
         const questionnaire = await questionnaireService.getBySessionId(params.id);

         if (!questionnaire) {
           return errorResponse(new Error('Questionnaire not found'), 404);
         }

         return successResponse(questionnaire);
       } catch (error) {
         return errorResponse(error);
       }
     }

     export async function PATCH(
       request: NextRequest,
       { params }: { params: { id: string } }
     ) {
       try {
         const body = await request.json();
         const questionnaire = await questionnaireService.update(params.id, body);

         return successResponse(questionnaire);
       } catch (error) {
         return errorResponse(error, 400);
       }
     }

     export async function DELETE(
       request: NextRequest,
       { params }: { params: { id: string } }
     ) {
       try {
         await questionnaireService.delete(params.id);
         return successResponse({ success: true });
       } catch (error) {
         return errorResponse(error);
       }
     }
     ```
   - **Dependencies:** Task 3.4.3 completed
   - **File to create:** `/src/app/api/admin/questionnaires/[id]/route.ts`

#### 3.5 API Routes - Client

**Tasks:**

1. **Create Client Response API** (Medium)
   - Create `src/app/api/intake/[sessionId]/responses/route.ts`:
     ```typescript
     import { NextRequest } from 'next/server';
     import { responseService } from '@/services/response.service';
     import { saveResponseSchema } from '@/lib/validation/questionnaire.schema';
     import { successResponse, errorResponse } from '@/lib/api/response';

     export async function GET(
       request: NextRequest,
       { params }: { params: { sessionId: string } }
     ) {
       try {
         const responses = await responseService.getResponses(params.sessionId);
         return successResponse(responses);
       } catch (error) {
         return errorResponse(error);
       }
     }

     export async function POST(
       request: NextRequest,
       { params }: { params: { sessionId: string } }
     ) {
       try {
         const body = await request.json();
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

         return successResponse(response);
       } catch (error) {
         return errorResponse(error, 400);
       }
     }
     ```
   - **Dependencies:** Task 3.3.3, 3.4.2 completed
   - **File to create:** `/src/app/api/intake/[sessionId]/responses/route.ts`

---

### Phase 4: Admin Portal UI
**Duration:** Week 3 (Days 1-5)
**Goal:** Build admin authentication and questionnaire management interface

#### 4.1 Admin Authentication

**Tasks:**

1. **Configure NextAuth** (Medium)
   - Create `src/app/api/auth/[...nextauth]/route.ts`:
     ```typescript
     import NextAuth, { AuthOptions } from 'next-auth';
     import CredentialsProvider from 'next-auth/providers/credentials';

     export const authOptions: AuthOptions = {
       providers: [
         CredentialsProvider({
           name: 'Admin Password',
           credentials: {
             password: { label: 'Password', type: 'password' },
           },
           async authorize(credentials) {
             if (credentials?.password === process.env.ADMIN_PASSWORD) {
               return { id: 'admin', name: 'Admin' };
             }
             return null;
           },
         }),
       ],
       pages: {
         signIn: '/admin/login',
       },
       session: {
         strategy: 'jwt',
         maxAge: 7 * 24 * 60 * 60, // 7 days
       },
       secret: process.env.NEXTAUTH_SECRET,
     };

     const handler = NextAuth(authOptions);
     export { handler as GET, handler as POST };
     ```
   - **Dependencies:** Task 1.1.3 completed
   - **File to create:** `/src/app/api/auth/[...nextauth]/route.ts`

2. **Create Login Page** (Simple)
   - Create `src/app/admin/login/page.tsx`:
     ```typescript
     'use client';

     import { useState } from 'react';
     import { signIn } from 'next-auth/react';
     import { useRouter } from 'next/navigation';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { Input } from '@/components/ui/input';
     import { Button } from '@/components/ui/button';

     export default function LoginPage() {
       const router = useRouter();
       const [password, setPassword] = useState('');
       const [error, setError] = useState('');
       const [loading, setLoading] = useState(false);

       async function handleSubmit(e: React.FormEvent) {
         e.preventDefault();
         setLoading(true);
         setError('');

         const result = await signIn('credentials', {
           password,
           redirect: false,
         });

         if (result?.ok) {
           router.push('/admin/dashboard');
         } else {
           setError('Invalid password. Please try again.');
           setLoading(false);
         }
       }

       return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
           <Card className="w-full max-w-md">
             <CardHeader>
               <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <Input
                     type="password"
                     placeholder="Enter admin password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                   />
                 </div>
                 {error && (
                   <p className="text-sm text-red-600">{error}</p>
                 )}
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? 'Logging in...' : 'Login'}
                 </Button>
               </form>
             </CardContent>
           </Card>
         </div>
       );
     }
     ```
   - **Dependencies:** Task 4.1.1, 1.3.2 completed
   - **File to create:** `/src/app/admin/login/page.tsx`

3. **Create Auth Middleware** (Simple)
   - Create `src/middleware.ts`:
     ```typescript
     import { withAuth } from 'next-auth/middleware';

     export default withAuth({
       callbacks: {
         authorized: ({ token }) => !!token,
       },
     });

     export const config = {
       matcher: ['/admin/dashboard/:path*', '/admin/questionnaire/:path*'],
     };
     ```
   - **Dependencies:** Task 4.1.1 completed
   - **File to create:** `/src/middleware.ts`

#### 4.2 Admin Dashboard

**Tasks:**

1. **Create Dashboard Page** (Complex)
   - Create `src/app/admin/dashboard/page.tsx`:
     ```typescript
     import { getServerSession } from 'next-auth';
     import { redirect } from 'next/navigation';
     import { authOptions } from '@/app/api/auth/[...nextauth]/route';
     import DashboardView from '@/components/admin/DashboardView';
     import { questionnaireService } from '@/services/questionnaire.service';

     export default async function DashboardPage() {
       const session = await getServerSession(authOptions);

       if (!session) {
         redirect('/admin/login');
       }

       const questionnaires = await questionnaireService.getAll();

       return <DashboardView questionnaires={questionnaires} />;
     }
     ```
   - **Dependencies:** Task 4.1.1, 3.3.2 completed
   - **File to create:** `/src/app/admin/dashboard/page.tsx`

2. **Create Dashboard Component** (Complex)
   - Create `src/components/admin/DashboardView.tsx`:
     ```typescript
     'use client';

     import { useState } from 'react';
     import { useRouter } from 'next/navigation';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { Button } from '@/components/ui/button';
     import { signOut } from 'next-auth/react';
     import { formatDistance } from 'date-fns';

     export default function DashboardView({ questionnaires }: any) {
       const router = useRouter();

       const getStatusColor = (status: string) => {
         switch (status) {
           case 'NOT_STARTED':
             return 'bg-gray-200 text-gray-700';
           case 'IN_PROGRESS':
             return 'bg-yellow-200 text-yellow-800';
           case 'COMPLETED':
             return 'bg-green-200 text-green-800';
           default:
             return 'bg-gray-200 text-gray-700';
         }
       };

       const getStatusLabel = (status: string) => {
         return status.replace('_', ' ');
       };

       return (
         <div className="min-h-screen bg-gray-50">
           <header className="bg-white border-b">
             <div className="container mx-auto px-4 py-4 flex justify-between items-center">
               <h1 className="text-2xl font-bold">Admin Dashboard</h1>
               <Button variant="outline" onClick={() => signOut()}>
                 Logout
               </Button>
             </div>
           </header>

           <main className="container mx-auto px-4 py-8">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-semibold">Questionnaires</h2>
               <Button onClick={() => router.push('/admin/questionnaire/new')}>
                 Create New Questionnaire
               </Button>
             </div>

             {questionnaires.length === 0 ? (
               <Card>
                 <CardContent className="py-12 text-center">
                   <p className="text-gray-500 mb-4">
                     No questionnaires yet. Create your first one!
                   </p>
                   <Button onClick={() => router.push('/admin/questionnaire/new')}>
                     Get Started
                   </Button>
                 </CardContent>
               </Card>
             ) : (
               <div className="grid gap-4">
                 {questionnaires.map((q: any) => (
                   <Card key={q.id}>
                     <CardContent className="p-6">
                       <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <h3 className="font-semibold text-lg">{q.title}</h3>
                           <p className="text-sm text-gray-600">Client: {q.clientName}</p>
                           <p className="text-xs text-gray-500 mt-1">
                             Created {formatDistance(new Date(q.createdAt), new Date(), { addSuffix: true })}
                           </p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(q.status)}`}>
                           {getStatusLabel(q.status)}
                         </span>
                       </div>

                       <div className="mt-4 flex gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => navigator.clipboard.writeText(
                             `${window.location.origin}/intake/${q.sessionId}`
                           )}
                         >
                           Copy URL
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => router.push(`/admin/questionnaire/${q.id}/edit`)}
                         >
                           Edit
                         </Button>
                         {q.status === 'COMPLETED' && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => router.push(`/admin/questionnaire/${q.id}/responses`)}
                           >
                             View Responses
                           </Button>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
           </main>
         </div>
       );
     }
     ```
   - **Dependencies:** Task 4.2.1, 1.3.2 completed
   - **File to create:** `/src/components/admin/DashboardView.tsx`

---

### Phase 5: Client Portal - Question Display
**Duration:** Week 4 (Days 1-5)
**Goal:** Build client-facing questionnaire interface

#### 5.1 Welcome Screen

**Tasks:**

1. **Create Intake Welcome Page** (Simple)
   - Create `src/app/intake/[sessionId]/page.tsx`:
     ```typescript
     import { notFound, redirect } from 'next/navigation';
     import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
     import { Button } from '@/components/ui/button';
     import { questionnaireRepository } from '@/repositories/questionnaire.repository';
     import Link from 'next/link';

     export default async function WelcomePage({ params }: { params: { sessionId: string } }) {
       const questionnaire = await questionnaireRepository.findBySessionId(params.sessionId);

       if (!questionnaire) {
         notFound();
       }

       if (questionnaire.status === 'COMPLETED') {
         redirect(`/intake/${params.sessionId}/complete`);
       }

       const questionCount = questionnaire.questions.length;
       const estimatedTime = Math.ceil(questionCount * 2); // 2 min per question estimate

       return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
           <Card className="max-w-2xl w-full">
             <CardHeader>
               <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="text-center space-y-2">
                 <p className="text-lg font-medium">{questionnaire.title}</p>
                 <p className="text-sm text-gray-600">For: {questionnaire.clientName}</p>
               </div>

               <div className="py-4 border-t border-b space-y-2">
                 <p className="text-sm">
                   This questionnaire will help us understand your business better before our consultation.
                 </p>
                 <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                   <li>{questionCount} questions</li>
                   <li>Estimated time: {estimatedTime}-{estimatedTime + 15} minutes</li>
                   <li>You can speak or type your answers</li>
                   <li>Your progress is saved automatically</li>
                 </ul>
               </div>

               <div className="pt-4">
                 <Link href={`/intake/${params.sessionId}/q/1`} className="w-full">
                   <Button size="lg" className="w-full">
                     Start Questionnaire
                   </Button>
                 </Link>
               </div>
             </CardContent>
           </Card>
         </div>
       );
     }
     ```
   - **Dependencies:** Task 3.2.2, 1.3.2 completed
   - **File to create:** `/src/app/intake/[sessionId]/page.tsx`

#### 5.2 Question View

**Tasks:**

1. **Create Question Page** (Complex)
   - Create `src/app/intake/[sessionId]/q/[number]/page.tsx`:
     ```typescript
     import { notFound, redirect } from 'next/navigation';
     import QuestionView from '@/components/client/QuestionView';
     import { questionnaireRepository } from '@/repositories/questionnaire.repository';
     import { responseRepository } from '@/repositories/response.repository';

     export default async function QuestionPage({
       params,
     }: {
       params: { sessionId: string; number: string };
     }) {
       const questionNumber = parseInt(params.number);

       if (isNaN(questionNumber) || questionNumber < 1) {
         notFound();
       }

       const questionnaire = await questionnaireRepository.findBySessionId(params.sessionId);

       if (!questionnaire) {
         notFound();
       }

       if (questionnaire.status === 'COMPLETED') {
         redirect(`/intake/${params.sessionId}/complete`);
       }

       const question = questionnaire.questions[questionNumber - 1];

       if (!question) {
         // If question number is beyond total questions, redirect to review
         redirect(`/intake/${params.sessionId}/review`);
       }

       // Get existing response if any
       const existingResponse = await responseRepository.findByQuestionId(
         questionnaire.id,
         question.id
       );

       return (
         <QuestionView
           sessionId={params.sessionId}
           question={question}
           questionNumber={questionNumber}
           totalQuestions={questionnaire.questions.length}
           existingResponse={existingResponse}
         />
       );
     }
     ```
   - **Dependencies:** Task 3.2.2, 3.2.3 completed
   - **File to create:** `/src/app/intake/[sessionId]/q/[number]/page.tsx`

2. **Create QuestionView Component** (Very Complex - Core Component)
   - Create `src/components/client/QuestionView.tsx`:
     ```typescript
     'use client';

     import { useState, useEffect } from 'react';
     import { useRouter } from 'next/navigation';
     import { Card, CardContent, CardHeader } from '@/components/ui/card';
     import { Button } from '@/components/ui/button';
     import { Progress } from '@/components/ui/progress';
     import { Textarea } from '@/components/ui/textarea';
     import { Input } from '@/components/ui/input';
     import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
     import VoiceInput from './VoiceInput';
     import FileUpload from './FileUpload';

     export default function QuestionView({
       sessionId,
       question,
       questionNumber,
       totalQuestions,
       existingResponse,
     }: any) {
       const router = useRouter();
       const [answer, setAnswer] = useState(existingResponse?.answerText || '');
       const [url, setUrl] = useState(existingResponse?.answerUrl || '');
       const [files, setFiles] = useState(existingResponse?.answerFiles || []);
       const [inputMethod, setInputMethod] = useState<'VOICE' | 'TEXT'>('TEXT');
       const [language, setLanguage] = useState<'EN' | 'ES'>('EN');
       const [saving, setSaving] = useState(false);
       const [saved, setSaved] = useState(false);

       const progress = (questionNumber / totalQuestions) * 100;
       const isLastQuestion = questionNumber === totalQuestions;
       const canProceed = !question.required || answer || url || files.length > 0;

       async function saveAnswer() {
         if (!canProceed) return;

         setSaving(true);
         setSaved(false);

         try {
           await fetch(`/api/intake/${sessionId}/responses`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               questionId: question.id,
               answer: {
                 text: answer,
                 files: files,
                 url: url,
                 inputMethod,
                 language,
               },
             }),
           });

           setSaved(true);
           setTimeout(() => setSaved(false), 2000);
         } catch (error) {
           console.error('Save failed:', error);
           alert('Failed to save answer. Please try again.');
         } finally {
           setSaving(false);
         }
       }

       async function handleNext() {
         await saveAnswer();

         if (isLastQuestion) {
           router.push(`/intake/${sessionId}/review`);
         } else {
           router.push(`/intake/${sessionId}/q/${questionNumber + 1}`);
         }
       }

       function handleBack() {
         if (questionNumber > 1) {
           router.push(`/intake/${sessionId}/q/${questionNumber - 1}`);
         } else {
           router.push(`/intake/${sessionId}`);
         }
       }

       function handleVoiceInput(transcript: string, detectedLanguage: 'EN' | 'ES') {
         setAnswer(transcript);
         setInputMethod('VOICE');
         setLanguage(detectedLanguage);
       }

       return (
         <div className="min-h-screen bg-gray-50 py-8 px-4">
           <div className="container mx-auto max-w-3xl space-y-4">
             {/* Progress Bar */}
             <div className="space-y-2">
               <div className="flex justify-between text-sm text-gray-600">
                 <span>Question {questionNumber} of {totalQuestions}</span>
                 <span>{Math.round(progress)}% complete</span>
               </div>
               <Progress value={progress} />
             </div>

             {/* Question Card */}
             <Card>
               <CardHeader>
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-gray-500">
                       Question {questionNumber}
                     </span>
                     {question.required && (
                       <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                         Required
                       </span>
                     )}
                   </div>
                   <h2 className="text-xl font-semibold">{question.questionText}</h2>
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Voice/Text Input based on question type */}
                 {question.questionType === 'FILE_UPLOAD' ? (
                   <FileUpload
                     sessionId={sessionId}
                     files={files}
                     url={url}
                     onFilesChange={setFiles}
                     onUrlChange={setUrl}
                   />
                 ) : (
                   <>
                     <VoiceInput
                       onTranscript={handleVoiceInput}
                       currentTranscript={inputMethod === 'VOICE' ? answer : ''}
                     />

                     <div className="space-y-2">
                       <label className="text-sm text-gray-600">Or type your response:</label>
                       {question.questionType === 'OPEN_ENDED' ? (
                         <Textarea
                           value={answer}
                           onChange={(e) => {
                             setAnswer(e.target.value);
                             setInputMethod('TEXT');
                           }}
                           placeholder="Type your answer here..."
                           rows={6}
                           className="resize-none"
                         />
                       ) : (
                         <Input
                           value={answer}
                           onChange={(e) => {
                             setAnswer(e.target.value);
                             setInputMethod('TEXT');
                           }}
                           placeholder="Type your answer..."
                         />
                       )}
                     </div>
                   </>
                 )}

                 {/* Save Indicator */}
                 {saved && (
                   <div className="flex items-center gap-2 text-sm text-green-600">
                     <Check className="w-4 h-4" />
                     <span>Saved</span>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Navigation */}
             <Card>
               <CardContent className="pt-6">
                 <div className="flex justify-between">
                   <Button variant="outline" onClick={handleBack}>
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     Back
                   </Button>

                   <Button
                     onClick={handleNext}
                     disabled={!canProceed || saving}
                     size="lg"
                   >
                     {saving ? 'Saving...' : isLastQuestion ? 'Review Answers' : 'Next'}
                     {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
                   </Button>
                 </div>

                 {!canProceed && question.required && (
                   <p className="text-sm text-red-600 text-center mt-2">
                     This question is required
                   </p>
                 )}
               </CardContent>
             </Card>
           </div>
         </div>
       );
     }
     ```
   - **Dependencies:** Task 5.2.1, 1.3.2 completed
   - **File to create:** `/src/components/client/QuestionView.tsx`
   - **Note:** This is a placeholder - VoiceInput and FileUpload components created in next phases

---

### Phase 6: Voice Input Implementation
**Duration:** Week 5 (Days 1-3)
**Goal:** Implement Web Speech API for voice dictation

#### 6.1 Voice Recognition Hook

**Tasks:**

1. **Create useVoiceRecognition Hook** (Complex)
   - Create `src/hooks/useVoiceRecognition.ts`:
     ```typescript
     import { useState, useEffect, useRef } from 'react';

     interface VoiceRecognitionOptions {
       continuous?: boolean;
       interimResults?: boolean;
       language?: 'en-US' | 'es-ES' | 'es-MX';
     }

     export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
       const [isListening, setIsListening] = useState(false);
       const [transcript, setTranscript] = useState('');
       const [interimTranscript, setInterimTranscript] = useState('');
       const [error, setError] = useState<string | null>(null);
       const [isSupported, setIsSupported] = useState(false);
       const recognitionRef = useRef<any>(null);

       useEffect(() => {
         // Check browser support
         if (typeof window !== 'undefined') {
           const SpeechRecognition =
             (window as any).SpeechRecognition ||
             (window as any).webkitSpeechRecognition;

           setIsSupported(!!SpeechRecognition);

           if (SpeechRecognition) {
             recognitionRef.current = new SpeechRecognition();
             const recognition = recognitionRef.current;

             recognition.continuous = options.continuous ?? true;
             recognition.interimResults = options.interimResults ?? true;
             recognition.lang = options.language ?? 'en-US';

             recognition.onresult = (event: any) => {
               let interim = '';
               let final = '';

               for (let i = event.resultIndex; i < event.results.length; i++) {
                 const transcript = event.results[i][0].transcript;

                 if (event.results[i].isFinal) {
                   final += transcript + ' ';
                 } else {
                   interim += transcript;
                 }
               }

               if (final) {
                 setTranscript((prev) => prev + final);
               }
               setInterimTranscript(interim);
             };

             recognition.onerror = (event: any) => {
               console.error('Speech recognition error:', event.error);
               setError(event.error);
               setIsListening(false);
             };

             recognition.onend = () => {
               setIsListening(false);
               setInterimTranscript('');
             };
           }
         }

         return () => {
           if (recognitionRef.current) {
             recognitionRef.current.stop();
           }
         };
       }, [options.continuous, options.interimResults, options.language]);

       const startListening = () => {
         if (recognitionRef.current && !isListening) {
           setError(null);
           recognitionRef.current.start();
           setIsListening(true);
         }
       };

       const stopListening = () => {
         if (recognitionRef.current && isListening) {
           recognitionRef.current.stop();
           setIsListening(false);
         }
       };

       const resetTranscript = () => {
         setTranscript('');
         setInterimTranscript('');
       };

       return {
         isListening,
         transcript,
         interimTranscript,
         error,
         isSupported,
         startListening,
         stopListening,
         resetTranscript,
       };
     }
     ```
   - **Dependencies:** None
   - **File to create:** `/src/hooks/useVoiceRecognition.ts`

#### 6.2 Voice Input Component

**Tasks:**

1. **Create VoiceInput Component** (Complex)
   - Create `src/components/client/VoiceInput.tsx`:
     ```typescript
     'use client';

     import { useState } from 'react';
     import { Button } from '@/components/ui/button';
     import { Card } from '@/components/ui/card';
     import { Mic, MicOff, RotateCcw } from 'lucide-react';
     import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

     interface VoiceInputProps {
       onTranscript: (transcript: string, language: 'EN' | 'ES') => void;
       currentTranscript?: string;
     }

     export default function VoiceInput({ onTranscript, currentTranscript = '' }: VoiceInputProps) {
       const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'es-ES'>('en-US');
       const {
         isListening,
         transcript,
         interimTranscript,
         error,
         isSupported,
         startListening,
         stopListening,
         resetTranscript,
       } = useVoiceRecognition({
         continuous: true,
         interimResults: true,
         language: selectedLanguage,
       });

       const displayTranscript = transcript + interimTranscript;

       function handleToggleListening() {
         if (isListening) {
           stopListening();
           if (transcript) {
             onTranscript(transcript, selectedLanguage === 'en-US' ? 'EN' : 'ES');
           }
         } else {
           startListening();
         }
       }

       function handleReset() {
         resetTranscript();
         onTranscript('', selectedLanguage === 'en-US' ? 'EN' : 'ES');
       }

       if (!isSupported) {
         return (
           <Card className="p-4 bg-yellow-50 border-yellow-200">
             <p className="text-sm text-yellow-800">
               Voice input is not supported in your browser. Please use the text input below.
             </p>
           </Card>
         );
       }

       return (
         <div className="space-y-4">
           <div className="flex gap-2 items-center">
             <Button
               type="button"
               size="lg"
               variant={isListening ? 'destructive' : 'default'}
               onClick={handleToggleListening}
               className="flex-1"
             >
               {isListening ? (
                 <>
                   <MicOff className="w-5 h-5 mr-2" />
                   Stop Recording
                 </>
               ) : (
                 <>
                   <Mic className="w-5 h-5 mr-2" />
                   Tap to Speak
                 </>
               )}
             </Button>

             {transcript && (
               <Button
                 type="button"
                 variant="outline"
                 size="lg"
                 onClick={handleReset}
               >
                 <RotateCcw className="w-5 h-5" />
               </Button>
             )}
           </div>

           <div className="flex gap-2">
             <Button
               type="button"
               variant={selectedLanguage === 'en-US' ? 'default' : 'outline'}
               size="sm"
               onClick={() => setSelectedLanguage('en-US')}
               disabled={isListening}
             >
               English
             </Button>
             <Button
               type="button"
               variant={selectedLanguage === 'es-ES' ? 'default' : 'outline'}
               size="sm"
               onClick={() => setSelectedLanguage('es-ES')}
               disabled={isListening}
             >
               Español
             </Button>
           </div>

           {isListening && (
             <div className="p-3 bg-blue-50 border border-blue-200 rounded">
               <p className="text-sm font-medium text-blue-900 mb-1">Listening...</p>
               <p className="text-sm text-blue-700">
                 {displayTranscript || 'Start speaking...'}
               </p>
             </div>
           )}

           {!isListening && displayTranscript && (
             <div className="p-3 bg-gray-50 border rounded">
               <p className="text-sm font-medium text-gray-700 mb-1">Your recording:</p>
               <p className="text-sm text-gray-900 whitespace-pre-wrap">
                 {displayTranscript}
               </p>
             </div>
           )}

           {error && (
             <div className="p-3 bg-red-50 border border-red-200 rounded">
               <p className="text-sm text-red-800">
                 Error: {error}. Please try again or use text input.
               </p>
             </div>
           )}
         </div>
       );
     }
     ```
   - **Dependencies:** Task 6.1.1, 1.3.2 completed
   - **File to create:** `/src/components/client/VoiceInput.tsx`

---

### Phase 7: File Upload Implementation
**Duration:** Week 5 (Days 4-5)
**Goal:** Implement file uploads to Supabase Storage

#### 7.1 Supabase Storage Upload Utilities

**Tasks:**

1. **Create Supabase Storage Client** (Medium)
   - Create `src/lib/storage/supabase.ts`:
     ```typescript
     import { createClient } from '@supabase/supabase-js';

     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!
     );

     const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'intake-uploads';

     export async function uploadFile(
       file: File,
       sessionId: string
     ): Promise<{ fileUrl: string; fileKey: string }> {
       const fileKey = `${sessionId}/${Date.now()}-${file.name}`;

       const { data, error } = await supabase.storage
         .from(BUCKET_NAME)
         .upload(fileKey, file, {
           contentType: file.type,
           upsert: false,
         });

       if (error) throw error;

       const { data: { publicUrl } } = supabase.storage
         .from(BUCKET_NAME)
         .getPublicUrl(fileKey);

       return { fileUrl: publicUrl, fileKey };
     }

     export async function generateSignedUrl(
       fileKey: string,
       expiresIn = 3600
     ): Promise<string> {
       const { data, error } = await supabase.storage
         .from(BUCKET_NAME)
         .createSignedUrl(fileKey, expiresIn);

       if (error) throw error;
       return data.signedUrl;
     }

     export async function deleteFile(fileKey: string): Promise<void> {
       const { error } = await supabase.storage
         .from(BUCKET_NAME)
         .remove([fileKey]);

       if (error) throw error;
     }
     ```
   - Supabase SDK already installed in Phase 2
   - **Dependencies:** Task 2.3 completed (storage bucket created)
   - **File to create:** `/src/lib/storage/supabase.ts`

2. **Create Upload API Endpoint** (Medium)
   - Create `src/app/api/upload/route.ts`:
     ```typescript
     import { NextRequest } from 'next/server';
     import { uploadFile } from '@/lib/storage/supabase';
     import { successResponse, errorResponse } from '@/lib/api/response';

     export async function POST(request: NextRequest) {
       try {
         const formData = await request.formData();
         const file = formData.get('file') as File;
         const sessionId = formData.get('sessionId') as string;

         if (!file || !sessionId) {
           throw new Error('file and sessionId are required');
         }

         // Validate file type
         const allowedTypes = [
           'application/pdf',
           'application/msword',
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel',
           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'image/png',
           'image/jpeg',
         ];

         if (!allowedTypes.includes(file.type)) {
           throw new Error('File type not allowed');
         }

         // Validate file size (50MB limit)
         if (file.size > 50 * 1024 * 1024) {
           throw new Error('File exceeds 50MB limit');
         }

         const { fileUrl, fileKey } = await uploadFile(file, sessionId);

         return successResponse({
           fileUrl,
           fileKey,
           fileName: file.name,
           fileSize: file.size
         });
       } catch (error) {
         return errorResponse(error, 400);
       }
     }
     ```
   - **Dependencies:** Task 7.1.1, 3.4.1 completed
   - **File to create:** `/src/app/api/upload/route.ts`

#### 7.2 File Upload Component

**Tasks:**

1. **Create FileUpload Component** (Complex)
   - Create `src/components/client/FileUpload.tsx`:
     ```typescript
     'use client';

     import { useState } from 'react';
     import { Button } from '@/components/ui/button';
     import { Input } from '@/components/ui/input';
     import { Card } from '@/components/ui/card';
     import { Upload, X, ExternalLink } from 'lucide-react';

     interface FileUploadProps {
       sessionId: string;
       files: any[];
       url: string;
       onFilesChange: (files: any[]) => void;
       onUrlChange: (url: string) => void;
     }

     export default function FileUpload({ sessionId, files, url, onFilesChange, onUrlChange }: FileUploadProps) {
       const [uploading, setUploading] = useState(false);
       const [error, setError] = useState('');

       async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
         const selectedFiles = Array.from(e.target.files || []);

         if (selectedFiles.length === 0) return;

         setUploading(true);
         setError('');

         try {
           const uploadedFiles = [];

           for (const file of selectedFiles) {
             // Check file size (50MB limit)
             if (file.size > 50 * 1024 * 1024) {
               throw new Error(`${file.name} exceeds 50MB limit`);
             }

             // Upload file directly to Supabase Storage via FormData
             const formData = new FormData();
             formData.append('file', file);
             formData.append('sessionId', sessionId);

             const res = await fetch('/api/upload', {
               method: 'POST',
               body: formData,
             });

             if (!res.ok) {
               throw new Error(`Failed to upload ${file.name}`);
             }

             const { data } = await res.json();

             uploadedFiles.push({
               fileName: data.fileName,
               fileUrl: data.fileUrl,
               fileSize: data.fileSize,
             });
           }

           onFilesChange([...files, ...uploadedFiles]);
         } catch (err: any) {
           setError(err.message);
         } finally {
           setUploading(false);
         }
       }

       function removeFile(index: number) {
         onFilesChange(files.filter((_, i) => i !== index));
       }

       return (
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium mb-2">Upload Files</label>
             <div className="flex gap-2">
               <label className="flex-1">
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition">
                   <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                   <p className="text-sm text-gray-600">
                     Click to select files or drag and drop
                   </p>
                   <p className="text-xs text-gray-500 mt-1">
                     PDF, DOC, XLS, PNG, JPG (max 50MB per file)
                   </p>
                 </div>
                 <input
                   type="file"
                   multiple
                   onChange={handleFileSelect}
                   disabled={uploading}
                   className="hidden"
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                 />
               </label>
             </div>

             {uploading && (
               <p className="text-sm text-blue-600 mt-2">Uploading files...</p>
             )}

             {error && (
               <p className="text-sm text-red-600 mt-2">{error}</p>
             )}
           </div>

           {files.length > 0 && (
             <div className="space-y-2">
               <label className="block text-sm font-medium">Uploaded Files:</label>
               {files.map((file, index) => (
                 <Card key={index} className="p-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 flex-1 min-w-0">
                       <span className="text-sm truncate">{file.fileName}</span>
                       <a
                         href={file.fileUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-800"
                       >
                         <ExternalLink className="w-4 h-4" />
                       </a>
                     </div>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => removeFile(index)}
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 </Card>
               ))}
             </div>
           )}

           <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-gray-300" />
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-gray-50 text-gray-500">OR</span>
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium mb-2">
               Shared Folder URL
             </label>
             <Input
               type="url"
               placeholder="https://drive.google.com/..."
               value={url}
               onChange={(e) => onUrlChange(e.target.value)}
             />
             <p className="text-xs text-gray-500 mt-1">
               Paste a link to Dropbox, Google Drive, or other shared folder
             </p>
           </div>
         </div>
       );
     }
     ```
   - **Dependencies:** Task 7.1.2, 1.3.2 completed
   - **File to create:** `/src/components/client/FileUpload.tsx`

---

## Continuation Note

The complete plan continues with:
- Phase 8: Review & Submit Flow
- Phase 9: Offline/Online Sync
- Phase 10: Testing Strategy
- Phase 11: Deployment & CI/CD
- Phase 12: Post-Launch Monitoring

Due to length constraints, I've provided the first 7 phases in detail. Each subsequent phase follows the same structure with:
- Clear duration and goals
- Specific tasks with complexity ratings
- Code examples and file paths
- Dependencies clearly marked
- Implementation guidance

---

## Critical Files Summary

The 5 most critical files for successful implementation:

1. **`/prisma/schema.prisma`** - Database foundation
2. **`/src/components/client/QuestionView.tsx`** - Core client UX
3. **`/src/components/admin/QuestionnaireEditor.tsx`** - Admin workflow
4. **`/src/hooks/useVoiceRecognition.ts`** - Voice feature
5. **`/src/services/response.service.ts`** - Business logic

---

## Development Best Practices

1. **Commit frequently** - After each completed task
2. **Test as you build** - Don't wait until Phase 10
3. **Mobile-first** - Test on real devices early
4. **Voice testing** - Test Spanish accuracy with native speakers
5. **Error handling** - Implement graceful degradation everywhere

---

## Success Criteria Checklist

Before launch, verify:
- [ ] Admin can create questionnaire in <5 minutes
- [ ] Client can complete intake in 15-30 minutes
- [ ] Voice input works in English and Spanish
- [ ] Offline sync recovers gracefully
- [ ] File uploads succeed >95% of the time
- [ ] Mobile experience is smooth on iOS Safari
- [ ] All required questions are validated
- [ ] Markdown export generates clean Q&A format
- [ ] Page load time <2 seconds on 4G

---

*End of Technical Implementation Plan*

For the complete detailed phases 8-12, refer to the comprehensive output provided by the Plan agent, which includes all code examples, dependencies, and implementation guidance for:
- Review & Submit functionality
- Offline/Online sync with IndexedDB
- Comprehensive testing strategy (Unit, Integration, E2E)
- Deployment pipeline with Vercel and GitHub Actions
- Post-launch monitoring with Sentry, PostHog, and Vercel Analytics
