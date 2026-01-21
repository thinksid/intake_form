# Technical Architecture Specification
## Agricultural Consulting Intake Form Web App

**Version:** 1.0
**Date:** January 2026
**Project:** Mobile-First Voice-Enabled Intake Form
**Status:** Architecture Design

---

## Executive Summary

This document defines the technical architecture for a mobile-first, voice-enabled intake form web application designed for agricultural consulting firms. The system enables consultants to create customizable questionnaires and clients to complete them efficiently using voice dictation in English and Spanish.

**Key Technical Constraints:**
- Mobile-first with iOS Safari and Chrome optimization
- Voice dictation as primary input (English + Spanish)
- Sub-2-second initial load on 4G networks
- Robust offline capabilities with auto-save
- 50MB file upload support
- Cost-effective MVP deployment

---

## 1. System Overview

### 1.1 Architecture Philosophy

**Clean Architecture Principles:**
- Clear separation between Admin and Client domains
- Presentation layer independent of business logic
- Database-agnostic data layer with repository pattern
- External services (voice, storage) abstracted via interfaces

**Design Priorities for MVP:**
1. **Speed to market:** Favor proven, simple technologies
2. **Mobile performance:** Optimize for network-constrained environments
3. **Cost containment:** Serverless-first, pay-per-use model
4. **Maintainability:** Monorepo, TypeScript everywhere, minimal dependencies

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐           ┌──────────────────┐          │
│  │  Admin Portal    │           │  Client Portal   │          │
│  │  (React SPA)     │           │  (React SPA)     │          │
│  │                  │           │                  │          │
│  │  - Dashboard     │           │  - Question UI   │          │
│  │  - CSV Upload    │           │  - Voice Input   │          │
│  │  - Editor        │           │  - Auto-save     │          │
│  │  - Export        │           │  - File Upload   │          │
│  └────────┬─────────┘           └─────────┬────────┘          │
│           │                               │                    │
│           └───────────────┬───────────────┘                    │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                      APPLICATION TIER                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│              ┌─────────────────────────────┐                  │
│              │   Next.js API Routes        │                  │
│              │   (Node.js Runtime)         │                  │
│              └─────────────┬───────────────┘                  │
│                            │                                   │
│        ┌───────────────────┼───────────────────┐              │
│        │                   │                   │              │
│  ┌─────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐       │
│  │ Auth       │    │ Question-   │    │ Response    │       │
│  │ Service    │    │ naire       │    │ Service     │       │
│  │            │    │ Service     │    │             │       │
│  └────────────┘    └─────────────┘    └─────────────┘       │
│                                                                │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                       DATA & STORAGE TIER                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   PostgreSQL     │  │  Supabase        │  │   Redis     │ │
│  │   (Supabase)     │  │  Storage         │  │  (Upstash)  │ │
│  │                  │  │                  │  │             │ │
│  │  - Questionnaires│  │  - Uploaded Files│  │  - Sessions │ │
│  │  - Questions     │  │                  │  │  - Rate     │ │
│  │  - Responses     │  │                  │  │    Limiting │ │
│  │  - Sessions      │  │                  │  │             │ │
│  └──────────────────┘  └──────────────────┘  └─────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │  Web Speech API  │  │  Email Service   │  │  Analytics  │ │
│  │  (Browser)       │  │  (Resend)        │  │  (Posthog)  │ │
│  └──────────────────┘  └──────────────────┘  └─────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) + React 18 | SSR for initial load performance, React for SPA experience, industry standard |
| **Language** | TypeScript 5.x | Type safety, better DX, refactoring confidence |
| **State Management** | Zustand + React Query | Lightweight, avoids Redux complexity, React Query handles server state |
| **UI Framework** | Tailwind CSS + shadcn/ui | Rapid development, mobile-first utilities, accessible components |
| **Backend Runtime** | Node.js 20.x (Next.js API Routes) | JavaScript everywhere, fast iteration, excellent npm ecosystem |
| **Database** | PostgreSQL 15+ (Supabase) | Relational integrity, JSON support, managed service with generous free tier |
| **File Storage** | Supabase Storage | Integrated with Supabase, 100GB included in Pro plan, zero additional cost |
| **Session Store** | Redis (Upstash) | Fast session lookups, serverless-compatible |
| **Authentication** | NextAuth.js | Simple credentials provider for shared password |
| **Voice Input** | Web Speech API (browser-native) | Zero cost, low latency, adequate for MVP |
| **Email** | Resend | Developer-friendly, reliable, affordable |
| **Deployment** | Vercel | Zero-config Next.js deployment, edge network, excellent DX |
| **Monitoring** | Vercel Analytics + Sentry | Performance tracking, error monitoring |

---

## 2. Frontend Architecture

### 2.1 Framework Choice: Next.js 14 (App Router)

**Decision: Next.js 14 with App Router**

**Rationale:**
- **SSR for performance:** Critical for <2s initial load on 4G
- **File-based routing:** Simplifies admin/client portal separation
- **API routes co-located:** Backend logic in same repository
- **Automatic code splitting:** Only load what's needed per route
- **Image optimization:** Built-in for consultant logos
- **Edge runtime support:** Future optimization path
- **Industry standard:** Large ecosystem, extensive documentation

**Alternatives Considered:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Create React App | Simple, widely known | No SSR, slower initial load | ❌ Rejected - performance |
| Vite + React | Fast dev server, modern | Manual SSR setup, more config | ❌ Rejected - complexity |
| Remix | Excellent data loading | Newer, smaller ecosystem | ❌ Rejected - team familiarity |

### 2.2 State Management Strategy

**Local State:** React `useState` and `useReducer` for component-specific state

**Global Client State:** Zustand (lightweight alternative to Redux)
```typescript
// stores/questionnaireStore.ts
interface QuestionnaireStore {
  currentQuestion: number;
  answers: Map<string, Answer>;
  isOffline: boolean;
  saveAnswer: (questionId: string, answer: Answer) => void;
  syncPendingAnswers: () => Promise<void>;
}
```

**Server State:** React Query (TanStack Query)
- Automatic caching, refetching, and background updates
- Optimistic updates for auto-save
- Offline queue management

**Why not Redux?**
- Excessive boilerplate for this use case
- Zustand provides 80% of benefits with 20% of the code
- React Query handles server state better than Redux

### 2.3 Voice Input Implementation

**Decision: Web Speech API (Browser-Native)**

**Architecture:**
```typescript
// hooks/useVoiceInput.ts
interface VoiceInputConfig {
  language: 'en-US' | 'es-ES' | 'es-MX';
  continuous: boolean;
  interimResults: boolean;
}

export function useVoiceInput(config: VoiceInputConfig) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);

  const recognition = useMemo(() => {
    if (!('webkitSpeechRecognition' in window)) {
      return null;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = config.language;
    recognition.continuous = config.continuous;
    recognition.interimResults = config.interimResults;
    return recognition;
  }, [config]);

  // Event handlers, start/stop methods
}
```

**Fallback Strategy:**
1. **Feature detection:** Check for `webkitSpeechRecognition` on mount
2. **Graceful degradation:** Show text input if unsupported
3. **Error handling:** Network errors → auto-switch to text input
4. **User control:** "Re-record" and "Edit" always available

**Spanish Support:**
- Auto-detection not reliable in Web Speech API
- **Solution:** Manual language toggle (EN/ES) in UI
- Default to user's browser language preference
- Persist language choice in session

**Browser Compatibility:**
| Browser | Support | Notes |
|---------|---------|-------|
| iOS Safari 14.5+ | ✅ Excellent | Primary target |
| Chrome Mobile | ✅ Excellent | Primary target |
| Firefox Mobile | ❌ Limited | Fallback to text |
| Samsung Internet | ⚠️ Partial | Test required |

**Future Enhancement Path:**
If Web Speech API proves insufficient (Spanish accuracy <85%, high failure rate):
- Migrate to Deepgram or AssemblyAI
- Cost: ~$0.0043/minute (Deepgram)
- Latency: Similar to Web Speech (~500ms)
- Implementation: Swap hook implementation, keep interface

### 2.4 Offline/Online Sync Strategy

**Approach: Optimistic UI + Background Sync**

**Architecture:**
```typescript
// services/syncService.ts
class SyncService {
  private queue: SyncQueue;
  private isOnline: boolean;

  async saveAnswer(answer: Answer): Promise<void> {
    // Optimistic update
    updateLocalState(answer);

    if (this.isOnline) {
      try {
        await api.saveAnswer(answer);
        removeFromQueue(answer.id);
      } catch (error) {
        addToQueue(answer);
        showToast('Saved locally. Will sync when online.');
      }
    } else {
      addToQueue(answer);
    }
  }

  async syncPendingAnswers(): Promise<void> {
    const pending = await this.queue.getAll();
    for (const answer of pending) {
      await api.saveAnswer(answer);
      await this.queue.remove(answer.id);
    }
  }
}
```

**Storage Strategy:**
- **Primary:** Server-side PostgreSQL (source of truth)
- **Client cache:** IndexedDB via `idb-keyval` (lighter than full IndexedDB wrapper)
- **Session recovery:** URL-based session ID + IndexedDB cache
- **Conflict resolution:** Last-write-wins (acceptable for MVP - single user per session)

**Network Detection:**
```typescript
// hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncService.syncPendingAnswers();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 2.5 Mobile Optimization Approach

**Performance Budget:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load (4G) | <2s | Lighthouse |
| Question transition | <200ms | Custom metric |
| Voice transcription lag | <1s | Custom metric |
| JavaScript bundle | <150KB gzipped | Webpack analyzer |

**Optimization Techniques:**

1. **Code Splitting:**
   ```typescript
   // Lazy load admin components (not needed for client)
   const AdminDashboard = lazy(() => import('@/components/admin/Dashboard'));
   const QuestionEditor = lazy(() => import('@/components/admin/QuestionEditor'));
   ```

2. **Image Optimization:**
   - Use Next.js `<Image>` component for logos
   - WebP format with PNG fallback
   - Lazy load below-the-fold images

3. **CSS Strategy:**
   - Tailwind with aggressive purging
   - Critical CSS inlined in `<head>`
   - No runtime CSS-in-JS (use Tailwind)

4. **Font Loading:**
   - System fonts first, fallback to Google Fonts
   - `font-display: swap` to prevent FOIT
   - Subset fonts (Latin + Spanish characters only)

5. **Prefetching:**
   ```typescript
   // Prefetch next question on current question mount
   useEffect(() => {
     if (currentQuestion < totalQuestions) {
       router.prefetch(`/intake/${sessionId}/q/${currentQuestion + 1}`);
     }
   }, [currentQuestion]);
   ```

6. **Prevent iOS Zoom:**
   ```css
   /* Ensure input font-size >= 16px */
   input, textarea, select {
     font-size: 16px;
   }
   ```

**Mobile-Specific Considerations:**
- **Touch targets:** Minimum 44x44px (Apple HIG)
- **Scroll behavior:** `scroll-behavior: smooth` for transitions
- **Viewport height:** Use `dvh` (dynamic viewport height) to account for mobile chrome
- **Input autofocus:** Avoid on iOS (triggers keyboard, shifts viewport)

### 2.6 Routing Structure

```
/
├── /admin
│   ├── /login                    # Admin authentication
│   ├── /dashboard                # Questionnaire list
│   ├── /questionnaire
│   │   ├── /new                  # Create questionnaire
│   │   ├── /[id]/edit            # Edit questionnaire
│   │   ├── /[id]/preview         # Preview mobile experience
│   │   └── /[id]/responses       # View responses
│   └── /settings                 # (Future) Admin settings
│
└── /intake
    └── /[sessionId]
        ├── /                     # Welcome screen
        ├── /q/[questionNumber]   # Question-by-question
        ├── /review               # Review all answers
        └── /complete             # Success screen
```

**Route Protection:**
- Admin routes: Middleware checks NextAuth session
- Client routes: No auth, validate session ID exists in database
- Invalid session IDs: 404 with helpful error message

---

## 3. Backend Architecture

### 3.1 Framework: Next.js API Routes (Node.js)

**Decision: Next.js API Routes over standalone backend**

**Rationale:**
- **Monorepo simplicity:** Frontend and backend in one codebase
- **Shared types:** TypeScript interfaces used in both layers
- **Deployment simplicity:** Single deployment to Vercel
- **Automatic serverless:** No server management
- **Cold start acceptable:** <500ms, mitigated by edge functions for critical paths

**API Architecture Pattern: Controller → Service → Repository**

```typescript
// Example: Save answer endpoint
// app/api/responses/[sessionId]/route.ts

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  // 1. Controller: Handle HTTP concerns
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const validatedData = SaveAnswerSchema.parse(body);

  // 2. Service: Business logic
  const responseService = new ResponseService();
  const saved = await responseService.saveAnswer({
    sessionId: params.sessionId,
    questionId: validatedData.questionId,
    answer: validatedData.answer,
  });

  // 3. Repository: Data access
  return NextResponse.json(saved, { status: 201 });
}
```

**Service Layer Example:**
```typescript
// services/ResponseService.ts
export class ResponseService {
  constructor(
    private responseRepo: ResponseRepository,
    private sessionRepo: SessionRepository
  ) {}

  async saveAnswer(data: SaveAnswerInput): Promise<Response> {
    // Validate session exists and is not completed
    const session = await this.sessionRepo.findById(data.sessionId);
    if (!session) throw new NotFoundError('Session not found');
    if (session.completed) throw new ValidationError('Session already completed');

    // Save or update answer
    const response = await this.responseRepo.upsert({
      sessionId: data.sessionId,
      questionId: data.questionId,
      answerText: data.answer.text,
      answerFiles: data.answer.files,
      inputMethod: data.answer.inputMethod,
      language: data.answer.language,
    });

    // Update session progress
    await this.sessionRepo.updateProgress(data.sessionId, data.questionId);

    return response;
  }
}
```

### 3.2 API Design

**REST Principles:**
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent error responses
- JSON payloads

**Key Endpoints:**

#### Admin Endpoints

```
POST   /api/admin/auth/login
  Body: { password: string }
  Response: { token: string, expiresAt: string }

POST   /api/admin/auth/logout
  Response: { success: true }

GET    /api/admin/questionnaires
  Response: { questionnaires: Questionnaire[] }

POST   /api/admin/questionnaires
  Body: { title: string, clientName: string, questions: Question[] }
  Response: { questionnaire: Questionnaire, shareUrl: string }

PUT    /api/admin/questionnaires/:id
  Body: { title?, clientName?, questions? }
  Response: { questionnaire: Questionnaire }

DELETE /api/admin/questionnaires/:id
  Response: { success: true }

POST   /api/admin/questionnaires/upload-csv
  Body: FormData (CSV file)
  Response: { questions: Question[], warnings?: string[] }

GET    /api/admin/questionnaires/:id/responses
  Response: { responses: Response[], completedAt: string }

GET    /api/admin/questionnaires/:id/export/csv
  Response: CSV file download

GET    /api/admin/questionnaires/:id/export/markdown
  Response: Markdown file download
```

#### Client Endpoints

```
GET    /api/intake/:sessionId
  Response: { questionnaire: Questionnaire, progress: Progress }

POST   /api/intake/:sessionId/responses
  Body: { questionId: string, answer: Answer }
  Response: { response: Response, nextQuestionId?: string }

PUT    /api/intake/:sessionId/responses/:questionId
  Body: { answer: Answer }
  Response: { response: Response }

POST   /api/intake/:sessionId/upload
  Body: FormData (file upload)
  Response: { url: string, fileName: string, size: number, mimeType: string }

POST   /api/intake/:sessionId/submit
  Response: { success: true, completedAt: string }
```

**Error Response Format:**
```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable (e.g., "SESSION_NOT_FOUND")
    message: string;        // Human-readable
    details?: unknown;      // Additional context
    statusCode: number;     // HTTP status
  }
}
```

### 3.3 Authentication Strategy

**Admin Authentication: Shared Password**

**Implementation: NextAuth.js Credentials Provider**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Password',
      credentials: {
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (credentials?.password === adminPassword) {
          return { id: 'admin', role: 'admin' };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Environment Configuration:**
```bash
# .env.local
ADMIN_PASSWORD=<strong-randomly-generated-password>
NEXTAUTH_SECRET=<cryptographic-random-secret>
NEXTAUTH_URL=https://yourdomain.com
```

**Middleware Protection:**
```typescript
// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });

    if (!token && request.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
```

**Client Session Management: URL-based**

No authentication required. Session identified by unique session ID in URL.

**Session ID Generation:**
```typescript
// utils/generateSessionId.ts
import { randomBytes } from 'crypto';

export function generateSessionId(): string {
  // 128-bit random, base64url encoded
  return randomBytes(16).toString('base64url'); // e.g., "kJ8xYz9P2mQ4rT6uV8wE1A"
}
```

**Security Considerations:**
- Session IDs are cryptographically random (128-bit entropy)
- HTTPS only (prevents session hijacking)
- Session IDs stored in database, validated on each request
- Rate limiting on session creation (prevent enumeration)

### 3.4 Rate Limiting

**Implementation: Upstash Rate Limit**

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Different rate limits for different endpoints
export const rateLimits = {
  // Client can save answer every 2 seconds
  saveAnswer: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
  }),

  // Admin can create questionnaires every 10 seconds
  createQuestionnaire: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(6, '1 m'),
  }),

  // File uploads: 10 per hour per session
  fileUpload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
  }),
};
```

**Usage in API Route:**
```typescript
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, reset } = await rateLimits.saveAnswer.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { status: 429, headers: { 'X-RateLimit-Reset': reset.toString() } }
    );
  }

  // Process request
}
```

---

## 4. Data Layer

### 4.1 Database: PostgreSQL (Supabase)

**Decision: PostgreSQL via Supabase**

**Rationale:**
- **Relational integrity:** Foreign keys, constraints ensure data consistency
- **JSON support:** JSONB columns for flexible answer storage
- **Full-text search:** Future feature (search within responses)
- **Managed service:** Automated backups, scaling, monitoring
- **Generous free tier:** 500MB database, 1GB file storage, 2GB bandwidth
- **Supabase benefits:** Real-time subscriptions (future), built-in auth (not using), edge functions (future)

**Alternatives Considered:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| MongoDB (Atlas) | Flexible schema, easy JSON | Less integrity, eventual consistency issues | ❌ Overkill for structured data |
| SQLite (Turso) | Embedded, fast | Scaling concerns, fewer features | ❌ Future scalability risk |
| PlanetScale | MySQL, branching | Vitess limitations, no foreign keys | ❌ Foreign keys critical |

### 4.2 Schema Design

**Entity Relationship Diagram:**

```
┌──────────────────────┐
│   questionnaires     │
├──────────────────────┤
│ id (PK)              │
│ title                │
│ client_name          │
│ status               │ ← Enum: not_started | in_progress | completed
│ session_id (unique)  │ ← For URL generation
│ created_at           │
│ completed_at         │
└──────────┬───────────┘
           │
           │ 1:N
           │
┌──────────▼───────────┐
│     questions        │
├──────────────────────┤
│ id (PK)              │
│ questionnaire_id (FK)│
│ question_text        │
│ question_type        │ ← Enum: open_ended | short_answer | file_upload
│ required             │
│ order                │ ← Integer for sequencing
└──────────┬───────────┘
           │
           │ 1:N
           │
┌──────────▼───────────┐
│     responses        │
├──────────────────────┤
│ id (PK)              │
│ questionnaire_id (FK)│
│ question_id (FK)     │
│ answer_text          │ ← Nullable for file_upload type
│ answer_files         │ ← JSONB array of file metadata
│ answer_url           │ ← Shared folder URL
│ input_method         │ ← Enum: voice | text
│ language             │ ← Enum: en | es
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│      sessions        │
├──────────────────────┤
│ id (PK)              │
│ questionnaire_id (FK)│
│ current_question_id  │ ← For resume functionality
│ last_activity        │
│ completed            │
│ device_info          │ ← JSONB (user agent, screen size)
└──────────────────────┘
```

**Schema SQL:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE questionnaire_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE question_type AS ENUM ('open_ended', 'short_answer', 'file_upload');
CREATE TYPE input_method AS ENUM ('voice', 'text');
CREATE TYPE language_code AS ENUM ('en', 'es');

-- Questionnaires table
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  status questionnaire_status NOT NULL DEFAULT 'not_started',
  session_id VARCHAR(32) UNIQUE NOT NULL, -- Base64url encoded random
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT questionnaires_session_id_unique UNIQUE (session_id)
);

CREATE INDEX idx_questionnaires_status ON questionnaires(status);
CREATE INDEX idx_questionnaires_created_at ON questionnaires(created_at DESC);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL,

  -- Constraints
  CONSTRAINT questions_order_positive CHECK ("order" > 0),
  CONSTRAINT questions_text_length CHECK (char_length(question_text) <= 500)
);

CREATE INDEX idx_questions_questionnaire_id ON questions(questionnaire_id);
CREATE INDEX idx_questions_order ON questions(questionnaire_id, "order");

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_files JSONB DEFAULT '[]'::jsonb, -- Array of {url, fileName, size, mimeType}
  answer_url TEXT, -- Shared folder URL
  input_method input_method NOT NULL,
  language language_code NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one response per question per questionnaire
  CONSTRAINT responses_unique_question UNIQUE (questionnaire_id, question_id)
);

CREATE INDEX idx_responses_questionnaire_id ON responses(questionnaire_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  current_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT false,
  device_info JSONB DEFAULT '{}'::jsonb,

  -- One session per questionnaire
  CONSTRAINT sessions_unique_questionnaire UNIQUE (questionnaire_id)
);

CREATE INDEX idx_sessions_questionnaire_id ON sessions(questionnaire_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- Trigger to update responses.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_responses_updated_at
BEFORE UPDATE ON responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 Indexing Strategy

**Performance-Critical Queries:**

1. **Admin Dashboard:** Fetch all questionnaires ordered by creation date
   - Index: `idx_questionnaires_created_at`

2. **Client Session Load:** Fetch questionnaire by session ID
   - Index: Unique constraint on `questionnaires.session_id` (automatic B-tree index)

3. **Question Sequencing:** Fetch questions in order for a questionnaire
   - Composite index: `idx_questions_order` on `(questionnaire_id, order)`

4. **Response Lookup:** Fetch all responses for a questionnaire
   - Index: `idx_responses_questionnaire_id`

5. **Session Resume:** Fetch session progress
   - Index: `idx_sessions_questionnaire_id`

**Future Optimization:**
- Full-text search on `responses.answer_text` (GIN index on tsvector column)
- Partial index on completed questionnaires for analytics queries

### 4.4 Repository Pattern Implementation

```typescript
// repositories/QuestionnaireRepository.ts
import { db } from '@/lib/db';

export class QuestionnaireRepository {
  async findAll(): Promise<Questionnaire[]> {
    return db.questionnaires.findMany({
      orderBy: { createdAt: 'desc' },
      include: { questions: true }
    });
  }

  async findBySessionId(sessionId: string): Promise<Questionnaire | null> {
    return db.questionnaires.findUnique({
      where: { sessionId },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
  }

  async create(data: CreateQuestionnaireInput): Promise<Questionnaire> {
    return db.questionnaires.create({
      data: {
        title: data.title,
        clientName: data.clientName,
        sessionId: generateSessionId(),
        questions: {
          create: data.questions.map((q, index) => ({
            questionText: q.text,
            questionType: q.type,
            required: q.required,
            order: index + 1
          }))
        }
      }
    });
  }

  async updateStatus(
    id: string,
    status: QuestionnaireStatus
  ): Promise<void> {
    await db.questionnaires.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null
      }
    });
  }

  async delete(id: string): Promise<void> {
    // Cascade delete handled by database foreign keys
    await db.questionnaires.delete({ where: { id } });
  }
}
```

**ORM Choice: Prisma**

**Rationale:**
- Type-safe queries generated from schema
- Excellent TypeScript integration
- Migration management built-in
- Connection pooling for serverless
- Works well with Supabase PostgreSQL

**Alternative Considered:**
- Drizzle ORM: Lighter, but less mature ecosystem

---

## 5. File Storage

### 5.1 Storage Solution: Supabase Storage

**Decision: Supabase Storage**

**Rationale:**
- **Zero additional cost:** 100GB storage included in Supabase Pro plan ($25/mo)
- **Unified platform:** Same authentication, SDK, and dashboard as database
- **Simpler setup:** No separate service configuration, reuses existing Supabase client
- **Built-in security:** Row-Level Security (RLS) policies, integrated authentication
- **CDN included:** Global edge network for fast file delivery
- **No egress fees:** All bandwidth included in plan

**Cost Comparison (100GB storage, 100GB egress/month):**
| Provider | Storage | Egress | Additional Cost |
|----------|---------|--------|-----------------|
| Supabase Storage (Pro) | Included (100GB) | Included | **$0** (part of $25 Pro plan) |
| Cloudflare R2 | $1.50 | $0.00 | **$1.50/month** |
| AWS S3 | $2.30 | $9.00 | **$11.30/month** |

**Why Supabase Storage over R2:**
- Already paying for Supabase Pro for database needs
- 100GB storage completely free as part of Pro plan
- Simpler architecture with one less service to manage
- Unified authentication and access control
- Same SDK (`@supabase/supabase-js`) for database and storage

### 5.2 Upload Strategy

**Approach: Direct Upload via Backend API**

**Flow:**
```
1. Client sends file to backend API
   POST /api/intake/:sessionId/upload
   Body: FormData with file

2. Backend validates and uploads to Supabase Storage
   - Validates file size (<50MB)
   - Validates MIME type (PDF, DOCX, XLSX, images)
   - Generates unique file path: `uploads/:sessionId/:uuid-:fileName`
   - Uploads to Supabase Storage bucket using service role key

3. Backend returns file metadata
   Response: { fileUrl, fileName, size, mimeType }

4. Client saves file metadata with answer
   POST /api/intake/:sessionId/responses
   Body: { questionId, answer: { files: [{ url, fileName, size }] } }
```

**Implementation:**

```typescript
// lib/storage.ts
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
);

export async function uploadFile(
  sessionId: string,
  file: File,
  fileName: string,
  mimeType: string
): Promise<{ fileUrl: string; filePath: string }> {
  // Validate file size
  if (file.size > 50 * 1024 * 1024) {
    throw new ValidationError('File size exceeds 50MB limit');
  }

  // Validate MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
  ];

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new ValidationError('File type not allowed');
  }

  // Generate unique file path
  const fileExt = fileName.split('.').pop();
  const filePath = `uploads/${sessionId}/${randomUUID()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(process.env.STORAGE_BUCKET_NAME!)
    .upload(filePath, file, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(process.env.STORAGE_BUCKET_NAME!)
    .getPublicUrl(filePath);

  return {
    fileUrl: urlData.publicUrl,
    filePath: data.path,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(process.env.STORAGE_BUCKET_NAME!)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
```

**API Route Implementation:**

```typescript
// app/api/intake/[sessionId]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const { fileUrl, filePath } = await uploadFile(
      params.sessionId,
      file,
      file.name,
      file.type
    );

    return NextResponse.json({
      data: {
        url: fileUrl,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
        path: filePath,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Client-Side Upload:**

```typescript
// utils/uploadFile.ts
export async function uploadFile(
  file: File,
  sessionId: string
): Promise<FileMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/intake/${sessionId}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const { data } = await response.json();
  return data;
}
```

### 5.3 Security Considerations

**Access Control:**
- Uploads scoped by session ID (prevent cross-session access)
- Pre-signed URLs expire in 5 minutes
- Files stored with non-guessable UUIDs
- Public read access (acceptable for MVP - files are shared with consultants anyway)

**Future Enhancement (Post-MVP):**
- Private bucket with signed download URLs
- Admin-only access, client cannot download files after upload
- Virus scanning via Cloudflare Workers

**Retention Policy:**
- Files retained indefinitely (consultant may need access months later)
- Admin can manually delete questionnaire (cascade deletes files)
- Future: Automatic deletion after 12 months (configurable)

---

## 6. Voice Processing

### 6.1 Web Speech API Analysis

**Browser Support Matrix:**

| Browser | API | Spanish Support | Accuracy | Notes |
|---------|-----|-----------------|----------|-------|
| Chrome Mobile | webkitSpeechRecognition | ✅ Excellent | 90-95% | Best option |
| iOS Safari 14.5+ | webkitSpeechRecognition | ✅ Good | 85-90% | Requires user gesture |
| Firefox Mobile | ❌ Not supported | N/A | N/A | Falls back to text |
| Samsung Internet | ✅ Partial | ⚠️ Limited | 75-80% | Testing required |

**Implementation Details:**

```typescript
// hooks/useWebSpeechRecognition.ts
import { useEffect, useRef, useState } from 'react';

interface WebSpeechConfig {
  language: 'en-US' | 'es-ES' | 'es-MX';
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export function useWebSpeechRecognition(config: WebSpeechConfig) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Feature detection
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();

    // Configuration
    recognition.lang = config.language;
    recognition.continuous = config.continuous ?? false;
    recognition.interimResults = config.interimResults ?? true;
    recognition.maxAlternatives = config.maxAlternatives ?? 1;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);

      // User-friendly error messages
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('Microphone not accessible. Check permissions.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Enable in settings.');
          break;
        case 'network':
          setError('Network error. Check your connection.');
          break;
        default:
          setError('Speech recognition error. Try typing instead.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [config.language]);

  const start = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionRef.current.start();
    }
  };

  const stop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const reset = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  };

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    reset,
  };
}
```

### 6.2 Spanish Language Support

**Challenges:**
- Web Speech API accuracy varies by accent (Castilian vs. Latin American)
- Regional vocabulary differences

**Solutions:**

1. **Language Selection UI:**
   ```typescript
   const languages = [
     { code: 'en-US', label: 'English' },
     { code: 'es-ES', label: 'Español (España)' },
     { code: 'es-MX', label: 'Español (México)' },
   ];
   ```

2. **Auto-detect Browser Language:**
   ```typescript
   const getBrowserLanguage = (): string => {
     const lang = navigator.language;
     if (lang.startsWith('es')) return 'es-MX'; // Default to Mexican Spanish
     return 'en-US';
   };
   ```

3. **Manual Override:**
   - Sticky toggle in UI: "English | Español"
   - Persisted to localStorage for session

**Quality Assurance:**
- Log transcription confidence scores (if available)
- Allow users to report inaccurate transcriptions (future feedback mechanism)

### 6.3 Fallback Strategy

**Graceful Degradation Levels:**

1. **Level 1:** Web Speech API works perfectly
   - Primary experience: Voice button prominent

2. **Level 2:** Web Speech API available but errors occur
   - Show error message
   - Auto-switch to text input
   - User can retry voice

3. **Level 3:** Web Speech API not supported (e.g., Firefox)
   - Hide voice button entirely
   - Text input is primary interface
   - Show info banner: "Voice input not supported on this browser. Try Chrome or Safari."

**Implementation:**

```typescript
// components/QuestionInput.tsx
export function QuestionInput({ question, onAnswer }: Props) {
  const { isSupported, error, transcript, /* ... */ } = useWebSpeechRecognition({
    language: userLanguage,
  });

  const [inputMethod, setInputMethod] = useState<'voice' | 'text'>(
    isSupported ? 'voice' : 'text'
  );

  // If voice errors occur, auto-fallback to text
  useEffect(() => {
    if (error && inputMethod === 'voice') {
      setInputMethod('text');
      toast.error(error, {
        description: 'You can type your response instead.',
      });
    }
  }, [error]);

  return (
    <div>
      {isSupported && inputMethod === 'voice' ? (
        <VoiceInput onTranscript={setTranscript} />
      ) : (
        <TextInput value={transcript} onChange={setTranscript} />
      )}

      {isSupported && (
        <button onClick={() => setInputMethod(prev => prev === 'voice' ? 'text' : 'voice')}>
          {inputMethod === 'voice' ? 'Type instead' : 'Use voice'}
        </button>
      )}
    </div>
  );
}
```

### 6.4 Real-time Transcription UX

**Visual Feedback States:**

1. **Idle:** Microphone button with "Tap to speak"
2. **Listening:** Pulsing red circle, "Listening..." text
3. **Interim Results:** Gray text showing partial transcription
4. **Final Results:** Black text, editable textarea
5. **Error:** Red error message, fallback to text

**Example Component:**

```typescript
function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { isListening, transcript, interimTranscript, start, stop } = useWebSpeechRecognition({
    language: 'en-US',
    interimResults: true,
  });

  return (
    <div>
      <button
        onClick={isListening ? stop : start}
        className={cn(
          'w-full p-6 rounded-lg transition-all',
          isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
        )}
      >
        {isListening ? (
          <>
            <MicIcon className="animate-pulse" />
            <span>Listening... (tap to stop)</span>
          </>
        ) : (
          <>
            <MicIcon />
            <span>Tap to speak</span>
          </>
        )}
      </button>

      {(transcript || interimTranscript) && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-black">{transcript}</p>
          {interimTranscript && (
            <p className="text-gray-400 italic">{interimTranscript}</p>
          )}
        </div>
      )}

      <textarea
        value={transcript}
        onChange={(e) => onTranscript(e.target.value)}
        placeholder="Your transcription will appear here. You can edit it."
        className="w-full mt-2 p-3 border rounded"
      />
    </div>
  );
}
```

### 6.5 Third-Party Alternative (Future)

**If Web Speech API proves insufficient:**

**Recommendation: Deepgram**

**Rationale:**
- Superior Spanish accuracy (95%+ vs. 85% Web Speech)
- Streaming transcription (real-time)
- Cost-effective: $0.0043/minute
- WebSocket API (low latency)
- Hosted in US/EU (GDPR compliant)

**Implementation Estimate:**
- 30 min average completion time
- 50% of time spent speaking (15 min)
- Cost per session: 15 * $0.0043 = **$0.065**
- 100 sessions/month = **$6.50/month**

**Migration Path:**
```typescript
// Abstract voice service interface
interface VoiceTranscriptionService {
  start(config: VoiceConfig): void;
  stop(): void;
  onTranscript(callback: (text: string) => void): void;
  onError(callback: (error: string) => void): void;
}

// Web Speech implementation
class WebSpeechService implements VoiceTranscriptionService {
  // Current implementation
}

// Deepgram implementation (future)
class DeepgramService implements VoiceTranscriptionService {
  private ws: WebSocket;

  start(config: VoiceConfig): void {
    this.ws = new WebSocket(`wss://api.deepgram.com/v1/listen?language=${config.language}`);
    // Stream audio from microphone
  }
}

// Factory pattern
function createVoiceService(): VoiceTranscriptionService {
  if (process.env.NEXT_PUBLIC_USE_DEEPGRAM === 'true') {
    return new DeepgramService();
  }
  return new WebSpeechService();
}
```

---

## 7. Security & Privacy

### 7.1 Admin Authentication

**Current Implementation (MVP):**
- Single shared password (stored in environment variable)
- NextAuth.js JWT-based sessions
- 7-day session expiry
- HTTPS only (enforced by middleware)

**Security Measures:**

1. **Password Strength:**
   - Minimum 16 characters, randomly generated
   - Stored in `.env.local` (never committed to git)
   - Rotated quarterly

2. **Session Security:**
   ```typescript
   // NextAuth configuration
   session: {
     strategy: 'jwt',
     maxAge: 7 * 24 * 60 * 60, // 7 days
   },
   cookies: {
     sessionToken: {
       name: '__Secure-next-auth.session-token',
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: true, // HTTPS only
       }
     }
   }
   ```

3. **Rate Limiting:**
   - Max 5 login attempts per IP per 15 minutes
   - Exponential backoff after failures

**Future Enhancement (Post-MVP):**
- Multi-user support with role-based access (owner, editor, viewer)
- 2FA via TOTP (Google Authenticator)
- Audit logging of admin actions

### 7.2 URL Security

**Session ID Generation:**

```typescript
import { randomBytes } from 'crypto';

export function generateSessionId(): string {
  // 128-bit cryptographic random
  // Base64url encoding (URL-safe)
  return randomBytes(16).toString('base64url');
  // Example: "kJ8xYz9P2mQ4rT6uV8wE1A"
}
```

**Entropy Analysis:**
- 128 bits = 2^128 possible values
- Brute force infeasible (340 undecillion combinations)

**Protection Against Enumeration:**
- Rate limit session lookups (10/min per IP)
- Session IDs not sequential (fully random)
- Database indexed lookup (constant time)

**Session Validation:**
```typescript
// middleware/validateSession.ts
export async function validateSession(sessionId: string): Promise<Questionnaire | null> {
  // Rate limit check
  const rateLimitResult = await rateLimits.sessionLookup.limit(getClientIP());
  if (!rateLimitResult.success) {
    throw new RateLimitError();
  }

  // Database lookup
  const questionnaire = await db.questionnaires.findUnique({
    where: { sessionId },
    include: { questions: true }
  });

  if (!questionnaire) {
    // Log suspicious activity (potential enumeration attempt)
    logger.warn('Invalid session ID access attempt', { sessionId, ip: getClientIP() });
    return null;
  }

  return questionnaire;
}
```

### 7.3 Data Encryption

**In Transit:**
- **TLS 1.3** enforced (HTTP Strict Transport Security header)
- All API endpoints require HTTPS
- Certificate managed by Vercel (automatic renewal)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS (Vercel handles this automatically, but explicit check)
  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https')) {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`);
  }

  // Set security headers
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

**At Rest:**
- **Database:** Supabase encrypts PostgreSQL at rest (AES-256)
- **File Storage:** Supabase Storage encrypts objects at rest (AES-256)
- **Environment Variables:** Vercel encrypts env vars, decrypts at runtime

**Sensitive Data Handling:**
- Admin password never logged or exposed in error messages
- Database connection strings in environment variables only
- API keys rotated every 90 days

### 7.4 GDPR & Privacy Considerations

**Data Collected:**

| Data Type | Purpose | Retention | Legal Basis |
|-----------|---------|-----------|-------------|
| Client responses (text) | Consulting engagement | Indefinite | Legitimate interest |
| Uploaded files | Supporting documentation | Indefinite | Legitimate interest |
| Voice metadata (language, input method) | Product improvement | Indefinite | Legitimate interest |
| Session data (device info, IP) | Analytics, fraud prevention | 90 days | Legitimate interest |

**User Rights (GDPR Compliance):**

1. **Right to Access:** Admin can export all data (CSV/Markdown)
2. **Right to Deletion:** Admin can delete questionnaire (cascade deletes all responses)
3. **Right to Rectification:** Client can edit responses before submission
4. **Right to Data Portability:** Export in machine-readable formats (CSV, JSON)

**Implementation:**

```typescript
// API route for data deletion
// DELETE /api/admin/questionnaires/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete questionnaire (cascade deletes questions, responses, files)
  await questionnaireService.delete(params.id);

  // Delete files from Supabase Storage
  await deleteFilesForQuestionnaire(params.id);

  // Audit log
  await auditLog.log({
    action: 'questionnaire_deleted',
    questionnaireId: params.id,
    userId: session.user.id,
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true });
}
```

**Privacy Policy Requirements:**
- Disclose data collection practices
- Explain purpose of voice transcription
- Provide contact for data requests
- Link to policy from welcome screen

**Data Minimization:**
- No personally identifiable information required from clients (name, email, etc.)
- Only collect what's necessary for consulting engagement
- No analytics cookies (use server-side analytics)

---

## 8. Deployment & Infrastructure

### 8.1 Hosting: Vercel

**Decision: Vercel for frontend and API**

**Rationale:**
- **Zero-config Next.js deployment:** Git push → automatic deploy
- **Edge Network:** Sub-100ms latency globally
- **Serverless Functions:** Automatic scaling, pay-per-use
- **Preview Deployments:** Every PR gets unique URL for testing
- **Environment Variables:** Secure, per-environment management
- **Free Tier:** Generous limits for MVP (100GB bandwidth, unlimited serverless invocations)

**Deployment Architecture:**

```
GitHub Repository (main branch)
         ↓
   Vercel CI/CD Pipeline
         ↓
   ┌─────────────────────┐
   │  Production Deploy  │
   │  (yourdomain.com)   │
   └─────────────────────┘
         ↓
   Vercel Edge Network
   (Global CDN + Serverless Functions)
         ↓
   ┌──────────┬──────────┬──────────┐
   │  Static  │   API    │  Image   │
   │  Assets  │  Routes  │  Optim.  │
   └──────────┴──────────┴──────────┘
```

**Environment Configuration:**

```bash
# .env.production (Vercel Dashboard)
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
DIRECT_URL=postgresql://user:pass@db.supabase.co:6543/postgres # Connection pooler

NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<randomly-generated-secret>
ADMIN_PASSWORD=<strong-password>

NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
STORAGE_BUCKET_NAME=intake-form-uploads

UPSTASH_REDIS_REST_URL=https://<redis-endpoint>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

RESEND_API_KEY=<api-key>

SENTRY_DSN=<sentry-dsn>
NEXT_PUBLIC_POSTHOG_KEY=<posthog-key>
```

### 8.2 Database Hosting: Supabase

**Configuration:**
- **Plan:** Free tier (500MB, 1GB egress, 2 daily backups)
- **Region:** US East (closest to Vercel default)
- **Connection Pooling:** PgBouncer in transaction mode
- **Backups:** Daily automated, 7-day retention

**Scaling Path:**
| Metric | Free Tier | Pro Tier ($25/mo) | When to Upgrade |
|--------|-----------|-------------------|-----------------|
| Storage | 500MB | 8GB | >400 questionnaires with responses |
| Concurrent connections | 60 | 200 | >50 concurrent users |
| Egress | 1GB/mo | 50GB/mo | >500 exports/month |

### 8.3 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
          NEXTAUTH_SECRET: test-secret

  deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Deployment Process:**

1. **Developer pushes to `develop` branch**
   - GitHub Actions runs linting, tests, type checks
   - Vercel creates preview deployment
   - Preview URL shared in PR comment

2. **PR merged to `main`**
   - GitHub Actions runs full CI pipeline
   - Vercel deploys to production
   - Database migrations run automatically (Prisma migrate)
   - Slack notification sent (future)

3. **Rollback Process:**
   - Vercel dashboard: Instant rollback to previous deployment
   - Database migrations: Manual rollback via Prisma

### 8.4 Database Migrations

**Prisma Migration Workflow:**

```bash
# Development: Create migration
npx prisma migrate dev --name add_file_upload_support

# Production: Apply migration
npx prisma migrate deploy
```

**Automated in CI/CD:**

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Migration Safety:**
- All migrations tested in preview deployment first
- No breaking changes without backward compatibility period
- Database backups taken before migrations (Supabase automatic)

### 8.5 Monitoring & Logging

**Application Performance Monitoring:**

**Vercel Analytics** (Free tier included)
- Real User Monitoring (RUM)
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- API response times

**Sentry** (Error Tracking)
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Scrub sensitive data
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});
```

**PostHog** (Product Analytics)
```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    autocapture: false, // Manual event tracking only
  });
}

// Usage
posthog.capture('questionnaire_submitted', {
  questionCount: 15,
  completionTime: 1234, // seconds
  voiceUsageRate: 0.8,
});
```

**Logging Strategy:**

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

export function logApiRequest(req: Request, res: Response, duration: number) {
  logger.info({
    type: 'api_request',
    method: req.method,
    path: req.url,
    statusCode: res.status,
    duration,
    ip: req.headers['x-forwarded-for'],
  });
}
```

**Metrics to Monitor:**

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Error rate | Sentry | >1% of requests |
| API response time (p95) | Vercel Analytics | >1000ms |
| Database query time (p95) | Prisma logging | >500ms |
| Voice transcription failures | PostHog | >10% of attempts |
| Upload failures | PostHog | >5% of attempts |
| 4xx/5xx errors | Vercel logs | >50/hour |

### 8.6 Scalability Considerations

**Current Architecture Scalability:**

| Component | Current | Scaling Limit | Bottleneck | Solution |
|-----------|---------|---------------|------------|----------|
| Vercel Serverless | Auto-scales | ~1000 concurrent | Cold starts | Edge functions |
| Supabase DB | 60 connections | 200 connections | Connection pool | Upgrade to Pro |
| Supabase Storage | 100GB (Pro) | Unlimited (pay per GB) | 100GB included | Upgrade to Team or cleanup |
| Upstash Redis | 10k commands/sec | 100k commands/sec | None | None |

**Traffic Projections:**

**Assumptions:**
- 100 questionnaires/month (MVP)
- Average 15 questions per questionnaire
- Average 30 min completion time
- 70% voice usage, 30% text

**Resource Usage:**
| Resource | Monthly | Cost |
|----------|---------|------|
| Database queries | ~45,000 | Free (Supabase) |
| File storage (10GB) | 10GB | $0 (Included in Supabase Pro) |
| File egress (50GB) | 50GB | $0 (Included in Supabase Pro) |
| Redis operations | ~15,000 | Free (Upstash) |
| Email sends | 200 | Free (Resend, 3k/mo free) |
| **Total** | | **$0/month** |

**Scaling Triggers:**
- **1,000 questionnaires/month:** Upgrade Supabase to Pro ($25/mo) - includes 100GB storage
- **>100GB file storage:** Upgrade to Team plan ($599/mo) or implement cleanup policies
- **10,000 questionnaires/month:** Dedicated PostgreSQL instance, CDN optimization
- **100,000 questionnaires/month:** Microservices architecture, separate voice processing service

---

## 9. API Design Reference

### 9.1 Request/Response Formats

**Standard Response Envelope:**

```typescript
// Success response
{
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2026-01-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid questionnaire data",
    "details": [
      { "field": "questions[0].text", "message": "Question text is required" }
    ]
  },
  "meta": {
    "timestamp": "2026-01-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### 9.2 Admin API Endpoints

**Authentication**

```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "password": "admin-password-here"
}

Response 200:
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-01-27T10:30:00Z"
  }
}

Response 401:
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid password"
  }
}
```

**Questionnaire Management**

```http
GET /api/admin/questionnaires
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "title": "Client Intake - Acme AgTech",
      "clientName": "Acme AgTech Inc.",
      "status": "completed",
      "sessionId": "kJ8xYz9P2mQ4rT6uV8wE1A",
      "shareUrl": "https://app.com/intake/kJ8xYz9P2mQ4rT6uV8wE1A",
      "questionCount": 15,
      "createdAt": "2026-01-15T09:00:00Z",
      "completedAt": "2026-01-16T14:30:00Z"
    }
  ]
}
```

```http
POST /api/admin/questionnaires
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Client Intake - Beta Corp",
  "clientName": "Beta Corp",
  "questions": [
    {
      "text": "Describe your business",
      "type": "open_ended",
      "required": true
    },
    {
      "text": "Annual revenue?",
      "type": "short_answer",
      "required": true
    }
  ]
}

Response 201:
{
  "data": {
    "id": "uuid",
    "title": "Client Intake - Beta Corp",
    "sessionId": "nP9qRx3S5tU7vW0yZ2aB4C",
    "shareUrl": "https://app.com/intake/nP9qRx3S5tU7vW0yZ2aB4C",
    "questions": [ /* ... */ ]
  }
}
```

**CSV Upload**

```http
POST /api/admin/questionnaires/upload-csv
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
  file: questionnaire.csv

Response 200:
{
  "data": {
    "questions": [
      { "text": "...", "type": "open_ended", "required": true },
      { "text": "...", "type": "short_answer", "required": false }
    ],
    "warnings": [
      "Row 5: Defaulted to 'required: true' (missing column)"
    ]
  }
}

Response 400:
{
  "error": {
    "code": "CSV_PARSE_ERROR",
    "message": "Invalid CSV format",
    "details": [
      { "row": 3, "message": "Missing 'question_text' column" }
    ]
  }
}
```

**Export Responses**

```http
GET /api/admin/questionnaires/{id}/export/markdown
Authorization: Bearer {token}

Response 200:
Content-Type: text/markdown
Content-Disposition: attachment; filename="acme_agtech_intake_2026-01-16.md"

# Client Intake Transcript
**Client:** Acme AgTech Inc.
...
```

### 9.3 Client API Endpoints

**Session Initialization**

```http
GET /api/intake/{sessionId}

Response 200:
{
  "data": {
    "questionnaire": {
      "title": "Client Intake",
      "clientName": "Acme AgTech",
      "totalQuestions": 15,
      "estimatedTime": "15-30 minutes"
    },
    "progress": {
      "currentQuestionNumber": 3,
      "answeredCount": 2,
      "percentComplete": 13
    },
    "questions": [
      {
        "id": "uuid",
        "text": "Describe your business",
        "type": "open_ended",
        "required": true,
        "order": 1
      }
      /* ... */
    ]
  }
}

Response 404:
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "This questionnaire is no longer available"
  }
}
```

**Save Answer**

```http
POST /api/intake/{sessionId}/responses
Content-Type: application/json

{
  "questionId": "uuid",
  "answer": {
    "text": "We're a precision agriculture SaaS platform...",
    "inputMethod": "voice",
    "language": "en"
  }
}

Response 201:
{
  "data": {
    "responseId": "uuid",
    "questionId": "uuid",
    "nextQuestionId": "uuid", // null if last question
    "progress": {
      "answeredCount": 3,
      "percentComplete": 20
    }
  }
}
```

**File Upload Flow**

```http
# Step 1: Upload file to backend
POST /api/intake/{sessionId}/upload
Content-Type: multipart/form-data

FormData:
  file: financials.pdf (binary)

Response 200:
{
  "data": {
    "url": "https://project.supabase.co/storage/v1/object/public/bucket/uploads/session123/uuid.pdf",
    "fileName": "financials.pdf",
    "size": 2048000,
    "mimeType": "application/pdf",
    "path": "uploads/session123/uuid.pdf"
  }
}

Response 400:
{
  "error": "File size exceeds 50MB limit"
}

# Step 2: Save file metadata with answer
POST /api/intake/{sessionId}/responses
{
  "questionId": "uuid",
  "answer": {
    "files": [
      {
        "url": "https://project.supabase.co/storage/v1/object/public/bucket/uploads/session123/uuid.pdf",
        "fileName": "financials.pdf",
        "size": 2048000,
        "mimeType": "application/pdf"
      }
    ],
    "inputMethod": "text",
    "language": "en"
  }
}
```

**Submit Questionnaire**

```http
POST /api/intake/{sessionId}/submit

Response 200:
{
  "data": {
    "success": true,
    "completedAt": "2026-01-16T14:30:00Z",
    "message": "Thank you! Your responses have been submitted."
  }
}

Response 400:
{
  "error": {
    "code": "INCOMPLETE_QUESTIONNAIRE",
    "message": "Please answer all required questions",
    "details": [
      { "questionId": "uuid", "questionNumber": 5, "text": "Annual revenue?" }
    ]
  }
}
```

### 9.4 Error Codes

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `UNAUTHORIZED` | 401 | Invalid or missing auth token | Please log in again |
| `INVALID_CREDENTIALS` | 401 | Wrong password | Invalid password |
| `SESSION_NOT_FOUND` | 404 | Invalid session ID | This questionnaire is no longer available |
| `QUESTIONNAIRE_NOT_FOUND` | 404 | Invalid questionnaire ID | Questionnaire not found |
| `VALIDATION_ERROR` | 400 | Invalid request data | Please check your input |
| `CSV_PARSE_ERROR` | 400 | Malformed CSV upload | Invalid CSV format |
| `FILE_TOO_LARGE` | 413 | File exceeds 50MB | File too large (max 50MB) |
| `UNSUPPORTED_FILE_TYPE` | 400 | Invalid file MIME type | File type not supported |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Too many requests. Try again later. |
| `QUESTIONNAIRE_ALREADY_COMPLETED` | 400 | Cannot modify completed questionnaire | This questionnaire is already submitted |
| `REQUIRED_QUESTION_UNANSWERED` | 400 | Submission with missing required answers | Please answer all required questions |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Something went wrong. Please try again. |

---

## 10. Technical Risks & Mitigation

### 10.1 Voice API Limitations

**Risk: Web Speech API Spanish accuracy <85%**

**Probability:** Medium
**Impact:** High (core feature degradation)

**Mitigation:**
1. **Pre-launch testing:**
   - User testing with 10 Spanish-speaking clients
   - Measure accuracy, collect feedback
   - Decision threshold: <80% accuracy → migrate to Deepgram

2. **Fallback ready:**
   - Text input always available
   - Graceful degradation messaging
   - "Re-record" and manual editing

3. **Migration path:**
   - Abstract voice service behind interface
   - Deepgram integration ready in 2 days
   - Feature flag for gradual rollout

**Monitoring:**
- Track voice vs. text usage rates
- Log transcription confidence scores
- User feedback mechanism ("Was this accurate?")

### 10.2 Mobile Browser Compatibility

**Risk: iOS Safari voice API instability or Firefox lack of support**

**Probability:** Medium
**Impact:** Medium (affects subset of users)

**Mitigation:**
1. **Progressive enhancement:**
   - Feature detection on page load
   - Hide voice button if unsupported
   - Text input as primary fallback

2. **Browser-specific handling:**
   ```typescript
   const isIOSSafari = /iPhone|iPad/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
   const isFirefox = /Firefox/.test(navigator.userAgent);

   if (isFirefox) {
     showTextOnlyUI();
   } else if (isIOSSafari) {
     // Requires user gesture to start
     requireTapToInitialize();
   }
   ```

3. **Testing matrix:**
   - iOS Safari 14.5, 15, 16, 17
   - Chrome Mobile (Android/iOS)
   - Samsung Internet
   - Firefox Mobile

**Monitoring:**
- Browser usage analytics
- Voice initialization success rate by browser
- Error rates by user agent

### 10.3 File Upload Reliability

**Risk: Network interruptions during large file uploads**

**Probability:** Medium
**Impact:** Medium (workaround available - shared folder URL)

**Mitigation:**
1. **Chunked uploads (future enhancement):**
   - Split files >10MB into chunks
   - Resume capability on failure
   - Library: `tus` (resumable upload protocol)

2. **Progress feedback:**
   ```typescript
   const uploadWithProgress = (file: File, onProgress: (percent: number) => void) => {
     const xhr = new XMLHttpRequest();
     xhr.upload.addEventListener('progress', (e) => {
       if (e.lengthComputable) {
         onProgress((e.loaded / e.total) * 100);
       }
     });
     // Upload logic
   };
   ```

3. **Alternative path:**
   - Shared folder URL field always visible
   - "Having trouble uploading? Paste a Google Drive/Dropbox link instead."

**Monitoring:**
- Upload success rate
- Upload duration (detect slow networks)
- Retry attempts per upload

### 10.4 Offline Sync Conflicts

**Risk: Client edits answers on two devices, creates conflict**

**Probability:** Low
**Impact:** Low (acceptable for MVP)

**Mitigation:**
1. **Last-write-wins strategy:**
   - Most recent update wins (no conflict resolution UI)
   - Acceptable because single user per session

2. **Warning in UI:**
   - "Opening this form on another device will sync your latest answers."
   - No multi-device editing support in MVP

3. **Future enhancement:**
   - Conflict detection via version timestamps
   - Conflict resolution UI: "You have unsaved changes on another device. Which version would you like to keep?"

**Monitoring:**
- Multi-device session occurrences (track by sessionId + device fingerprint)
- Sync conflict frequency

### 10.5 Cold Start Latency

**Risk: Serverless function cold starts >1s impact UX**

**Probability:** Medium (Vercel's edge functions mitigate)
**Impact:** Low (occasional delay acceptable)

**Mitigation:**
1. **Edge Functions for critical paths:**
   - Session validation
   - Answer saving
   - Run on edge (closer to user, faster cold starts)

2. **Warm-up strategy:**
   - Scheduled CRON job pings endpoints every 5 minutes (keeps functions warm)
   - Vercel Pro: Function warming included

3. **Optimistic UI:**
   - Save answer locally first
   - Show "Saved ✓" immediately
   - Sync in background

**Monitoring:**
- Function execution duration (p50, p95, p99)
- Cold start frequency
- User-perceived latency (RUM)

### 10.6 Database Connection Exhaustion

**Risk: Serverless functions exhaust database connection pool**

**Probability:** Low (Supabase's PgBouncer mitigates)
**Impact:** High (API failures)

**Mitigation:**
1. **Connection pooling:**
   - Supabase PgBouncer (transaction mode)
   - Prisma connection pooling
   - Max connections: 60 (free tier), 200 (pro)

2. **Connection management:**
   ```typescript
   // lib/db.ts
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = global as unknown as { prisma: PrismaClient };

   export const db = globalForPrisma.prisma || new PrismaClient({
     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
   });

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
   ```

3. **Monitoring:**
   - Active connection count (Supabase dashboard)
   - Connection errors (`P1001: Can't reach database`)
   - Alert at >80% capacity

**Scaling trigger:**
- Upgrade to Supabase Pro when >40 concurrent connections sustained

---

## 11. Implementation Roadmap

### 11.1 Development Phases

**Phase 1: Foundation (Weeks 1-2)**
- [ ] Repository setup (Next.js, TypeScript, Tailwind)
- [ ] Database schema (Prisma, Supabase)
- [ ] Authentication (NextAuth.js)
- [ ] Basic admin login and dashboard
- [ ] File storage setup (Supabase Storage bucket)

**Phase 2: Admin Portal (Weeks 3-4)**
- [ ] Create questionnaire (manual entry)
- [ ] CSV upload and parsing
- [ ] Question editor (add, edit, delete, reorder)
- [ ] Generate shareable URL
- [ ] View questionnaire list with status

**Phase 3: Client Portal (Weeks 4-6)**
- [ ] Welcome screen
- [ ] Question-by-question UI
- [ ] Text input
- [ ] Navigation (next, back)
- [ ] Progress indicator
- [ ] Auto-save implementation
- [ ] Review & submit flow

**Phase 4: Voice Integration (Week 6-7)**
- [ ] Web Speech API integration
- [ ] Voice input component
- [ ] Real-time transcription
- [ ] Language toggle (EN/ES)
- [ ] Error handling and fallbacks
- [ ] Voice/text mode switching

**Phase 5: File Handling (Week 7)**
- [ ] Backend upload endpoint implementation
- [ ] Direct upload to Supabase Storage
- [ ] File upload UI with progress
- [ ] Shared folder URL input
- [ ] File metadata storage

**Phase 6: Export & Polish (Week 8)**
- [ ] CSV export
- [ ] Markdown transcript export
- [ ] Email notifications (admin on submission)
- [ ] Mobile optimization (iOS Safari testing)
- [ ] Performance optimization
- [ ] Error messages and edge case handling

**Phase 7: Testing & Launch (Week 8-9)**
- [ ] End-to-end testing
- [ ] Browser compatibility testing
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

### 11.2 MVP Success Criteria

**Technical:**
- ✅ <2s initial load on 4G
- ✅ <200ms question transitions
- ✅ >95% auto-save success rate
- ✅ Voice transcription works in Chrome/Safari (EN + ES)
- ✅ Mobile responsive (iOS Safari, Chrome)
- ✅ Zero data loss (auto-save + session recovery)

**Functional:**
- ✅ Admin can create questionnaire in <5 minutes
- ✅ Client can complete questionnaire via voice
- ✅ Client can complete questionnaire via text (fallback)
- ✅ Admin can export CSV and Markdown
- ✅ Files upload successfully or shared folder URL accepted

**User Experience:**
- ✅ No login required for clients
- ✅ Progress saved across sessions
- ✅ Clear error messages with fallbacks
- ✅ One question at a time (progressive disclosure)

---

## 12. Appendix

### 12.1 Technology Alternatives Comparison

**Frontend Framework:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Next.js 14 | SSR, API routes, excellent DX | Learning curve (App Router) | ✅ **Selected** |
| Remix | Great data loading, nested routes | Smaller ecosystem | ❌ Team unfamiliarity |
| Vite + React | Fast dev, simple | Manual SSR setup | ❌ No SSR out of box |

**Database:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| PostgreSQL (Supabase) | Relational, ACID, managed | Costs at scale | ✅ **Selected** |
| MongoDB (Atlas) | Flexible schema | Less integrity | ❌ Overkill for structured data |
| PlanetScale | Branching, MySQL | No foreign keys | ❌ Foreign keys critical |

**File Storage:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Supabase Storage | 100GB included in Pro, unified platform | Tied to Supabase | ✅ **Selected** |
| Cloudflare R2 | Zero egress, S3-compatible | Additional service | ❌ Additional cost & complexity |
| AWS S3 | Industry standard | Egress costs high | ❌ Cost prohibitive |

**Voice Processing:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Web Speech API | Free, low latency | Accuracy varies | ✅ **MVP choice** |
| Deepgram | High accuracy, streaming | $0.0043/min | 🔄 **Fallback if needed** |
| AssemblyAI | Good accuracy | $0.00025/sec | ⚠️ More expensive |

### 12.2 Estimated Infrastructure Costs

**MVP (100 questionnaires/month):**
| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (free) | $0 |
| Supabase | Free | $0 |
| File Storage | Included in Supabase | $0 |
| Upstash Redis | Free (10k commands/day) | $0 |
| Resend | Free (3k emails/mo) | $0 |
| Sentry | Free (5k errors/mo) | $0 |
| PostHog | Free (1M events/mo) | $0 |
| **Total** | | **$0/month** |

**Growth (1,000 questionnaires/month):**
| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase Pro | Pro (includes 100GB storage) | $25 |
| File Storage | Included in Supabase Pro | $0 |
| Upstash Redis | Free | $0 |
| Resend | Pro (50k emails) | $20 |
| Sentry | Team | $26 |
| PostHog | Growth (10M events free) | $0 |
| **Total** | | **~$91/month** |

### 12.3 Security Checklist

**Pre-Launch:**
- [ ] HTTPS enforced (HSTS header)
- [ ] Environment variables never committed
- [ ] Database connection strings encrypted
- [ ] Admin password 16+ characters, randomly generated
- [ ] Session cookies httpOnly, secure, sameSite
- [ ] CSRF protection (NextAuth.js built-in)
- [ ] Rate limiting on all public endpoints
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection (React escaping, CSP headers)
- [ ] File upload MIME type validation
- [ ] Session ID cryptographically random (128-bit)
- [ ] No sensitive data in logs
- [ ] Sentry scrubbing configured
- [ ] Privacy policy published

**Post-Launch Monitoring:**
- [ ] Alert on >10 failed login attempts/hour
- [ ] Alert on 5xx error rate >1%
- [ ] Database backup verification
- [ ] Dependency vulnerability scanning (Dependabot)
- [ ] Quarterly password rotation

### 12.4 Performance Optimization Checklist

**Frontend:**
- [ ] JavaScript bundle <150KB gzipped
- [ ] Code splitting (admin vs. client)
- [ ] Image optimization (Next.js Image)
- [ ] Font subsetting (Latin + Spanish chars)
- [ ] Tailwind CSS purging
- [ ] Lazy loading below-fold content
- [ ] Prefetch next question
- [ ] Service worker for offline (future)

**Backend:**
- [ ] Database query optimization (indexes)
- [ ] N+1 query elimination (Prisma `include`)
- [ ] Response compression (gzip)
- [ ] CDN for static assets
- [ ] Edge functions for critical paths
- [ ] Connection pooling (PgBouncer)
- [ ] Redis caching for session lookups (future)

**Monitoring:**
- [ ] Lighthouse CI in GitHub Actions
- [ ] Real User Monitoring (Vercel Analytics)
- [ ] Synthetic monitoring (Checkly, future)
- [ ] Database slow query logging

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Architecture Agent | Initial comprehensive specification |
| 1.1 | 2026-01-20 | Architecture Agent | Updated file storage from Cloudflare R2 to Supabase Storage |

---

## Next Steps

1. **Stakeholder Review:** Share with product designer and client for alignment
2. **Development Kickoff:** Assign to front-end and back-end implementation agents
3. **Database Setup:** Provision Supabase project, run Prisma migrations
4. **Deployment:** Configure Vercel project, environment variables
5. **Testing Strategy:** Share with tester for test plan creation

---

*End of Technical Architecture Specification*
