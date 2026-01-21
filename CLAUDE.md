# Agricultural Consulting Intake Form

A mobile-first, voice-enabled web application for agricultural consulting firms to collect intake information from clients.

## Project Overview

This application enables consultants to create customizable questionnaires and clients to complete them efficiently using voice dictation in English and Spanish. It replaces traditional Google Sheets-based intake forms with a modern, progressive disclosure interface.

### Key Features
- **Admin Portal**: Create/edit questionnaires, view responses, export to CSV/Markdown
- **Client Portal**: Voice-first input, one question per screen, auto-save, file uploads
- **Voice Recognition**: Web Speech API with English and Spanish support
- **Mobile-First**: Optimized for iOS Safari and Chrome Mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 5
- **File Storage**: Supabase Storage
- **Authentication**: NextAuth.js (credentials provider)
- **Voice Input**: Web Speech API

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

The app runs on `http://localhost:4005`.

## Project Structure

```
├── app/
│   ├── admin/               # Admin portal pages
│   │   ├── login/           # Admin login
│   │   ├── dashboard/       # Questionnaire list
│   │   └── questionnaire/   # Create/edit questionnaires
│   ├── api/                 # API routes
│   │   ├── admin/           # Admin CRUD endpoints
│   │   ├── auth/            # NextAuth handlers
│   │   ├── intake/          # Client response endpoints
│   │   └── upload/          # File upload endpoint
│   └── intake/              # Client portal pages
│       └── [sessionId]/     # Questionnaire flow
├── components/
│   ├── admin/               # Admin-specific components
│   ├── client/              # Client-specific components
│   └── ui/                  # shadcn/ui components
├── hooks/
│   └── useVoiceRecognition.ts  # Voice input hook
├── lib/
│   ├── api.ts               # API response utilities
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client singleton
│   ├── supabase.ts          # Supabase client & storage
│   └── utils.ts             # Utility functions
├── prisma/
│   └── schema.prisma        # Database schema
└── types/
    └── index.ts             # TypeScript types
```

## Database Schema

The app uses three main tables:

### questionnaires
- `id` (UUID, primary key)
- `session_id` (VARCHAR, unique) - Used for client-facing URLs
- `title` (VARCHAR)
- `client_name` (VARCHAR)
- `status` (ENUM: NOT_STARTED, IN_PROGRESS, COMPLETED)
- `created_at`, `updated_at`, `completed_at` (timestamps)

### questions
- `id` (UUID, primary key)
- `questionnaire_id` (UUID, foreign key)
- `question_text` (TEXT)
- `question_type` (ENUM: OPEN_ENDED, SHORT_ANSWER, FILE_UPLOAD)
- `is_required` (BOOLEAN)
- `display_order` (INTEGER)

### responses
- `id` (UUID, primary key)
- `questionnaire_id` (UUID, foreign key)
- `question_id` (UUID, foreign key)
- `response_text` (TEXT, nullable)
- `file_url` (VARCHAR, nullable)
- Unique constraint on (questionnaire_id, question_id)

## API Endpoints

### Admin APIs (require authentication)
- `GET /api/admin/questionnaires` - List all questionnaires
- `POST /api/admin/questionnaires` - Create questionnaire
- `GET /api/admin/questionnaires/[id]` - Get single questionnaire
- `PATCH /api/admin/questionnaires/[id]` - Update questionnaire
- `DELETE /api/admin/questionnaires/[id]` - Delete questionnaire

### Client APIs (public via session ID)
- `GET /api/intake/[sessionId]` - Get questionnaire by session
- `GET /api/intake/[sessionId]/responses` - Get responses
- `POST /api/intake/[sessionId]/responses` - Save/update response
- `POST /api/intake/[sessionId]/submit` - Submit questionnaire

### File Upload
- `POST /api/upload` - Upload file to Supabase Storage (50MB limit)

## Environment Variables

Required in `.env.local`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
STORAGE_BUCKET_NAME="intake-uploads"

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:4005"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="$2b$10$..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:4005"
NODE_ENV="development"
```

## Authentication

Admin authentication uses NextAuth.js with a simple credentials provider. The admin email and password hash are stored in environment variables (not in the database) for simplicity in the MVP.

To generate a password hash:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

## Voice Recognition

Voice input uses the Web Speech API, which is supported in:
- Chrome (desktop and mobile)
- Safari (iOS 14.5+)
- Edge

The `useVoiceRecognition` hook provides:
- Start/stop recording
- Transcript accumulation
- Interim results (real-time feedback)
- Language switching (English/Spanish)
- Error handling and browser compatibility detection

## File Upload

Files are uploaded directly to Supabase Storage:
- Max file size: 50MB
- Supported types: PDF, DOC/DOCX, XLS/XLSX, PNG, JPG, GIF, CSV
- Files are organized by session ID in the storage bucket
- Clients can also provide shared folder URLs (Google Drive, Dropbox)

## Development Commands

```bash
# Development
npm run dev           # Start dev server on port 4005

# Database
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio

# Build
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
```

## Client Flow

1. **Welcome Screen** (`/intake/[sessionId]`)
   - Shows questionnaire info and estimated time
   - Option to continue if already started

2. **Question View** (`/intake/[sessionId]/q/[number]`)
   - One question per screen
   - Voice or text input
   - File upload for FILE_UPLOAD type
   - Auto-save with debounce
   - Progress indicator

3. **Review Screen** (`/intake/[sessionId]/review`)
   - Shows all questions and responses
   - Validates required questions
   - Edit buttons to jump to specific questions

4. **Complete Screen** (`/intake/[sessionId]/complete`)
   - Confirmation message
   - Next steps information

## Admin Flow

1. **Login** (`/admin/login`)
   - Email/password authentication

2. **Dashboard** (`/admin/dashboard`)
   - List of all questionnaires with status
   - Copy client URL to clipboard
   - Create, edit, delete questionnaires

3. **Create/Edit** (`/admin/questionnaire/new`, `/admin/questionnaire/[id]/edit`)
   - Title and client name
   - Add/remove/reorder questions
   - Set question type and required status

4. **View Responses** (`/admin/questionnaire/[id]/responses`)
   - View all responses for completed questionnaires
   - Export to CSV or Markdown

## Deployment

The app is designed for Vercel deployment:

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

For database migrations in production:
```bash
npx prisma migrate deploy
```

## Documentation

Detailed documentation is available in the `/docs` folder:
- `PRODUCT_DESIGN_DOCUMENT.md` - Product requirements
- `TECHNICAL_ARCHITECTURE_SPECIFICATION.md` - System design
- `TECHNICAL_IMPLEMENTATION_PLAN.md` - Implementation phases
- `BACKEND_IMPLEMENTATION_PLAN.md` - Backend details
- `FRONTEND_IMPLEMENTATION_PLAN.md` - Frontend details
