# Frontend Implementation Plan
## Agricultural Consulting Intake Form Web App

**Version:** 1.0
**Date:** January 2026
**Role:** Front-End Engineer
**Framework:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS

---

## Document Overview

This document provides a comprehensive frontend implementation plan for the agricultural intake form application. It covers component architecture, state management, voice input implementation, mobile-first UI patterns, and step-by-step implementation guidance.

**Related Documents:**
- [Product Design Document](./PRODUCT_DESIGN_DOCUMENT.md)
- [Technical Architecture Specification](./TECHNICAL_ARCHITECTURE_SPECIFICATION.md)
- [Technical Implementation Plan](./TECHNICAL_IMPLEMENTATION_PLAN.md)

---

## 1. Component Architecture

### 1.1 Component Hierarchy Overview

```
app/
├── admin/
│   ├── login/
│   │   └── page.tsx                    # Admin login screen
│   ├── dashboard/
│   │   └── page.tsx                    # Dashboard container (Server Component)
│   └── questionnaire/
│       ├── [id]/
│       │   ├── edit/
│       │   │   └── page.tsx            # Edit questionnaire container
│       │   └── responses/
│       │       └── page.tsx            # View responses container
│       └── new/
│           └── page.tsx                # Create questionnaire container
│
└── intake/
    └── [sessionId]/
        ├── page.tsx                    # Welcome screen
        ├── q/
        │   └── [number]/
        │       └── page.tsx            # Question container (Server Component)
        ├── review/
        │   └── page.tsx                # Review screen container
        └── complete/
            └── page.tsx                # Success screen

components/
├── admin/
│   ├── DashboardView.tsx               # Dashboard UI (Client Component)
│   ├── QuestionnaireCard.tsx           # Questionnaire list item
│   ├── QuestionnaireEditor.tsx         # Question editor (Client Component)
│   ├── QuestionList.tsx                # Draggable question list
│   ├── QuestionItem.tsx                # Individual question editor
│   ├── CSVUploadDialog.tsx             # CSV upload modal
│   ├── ResponseViewer.tsx              # Response display
│   └── ExportButtons.tsx               # CSV/Markdown export
│
├── client/
│   ├── QuestionView.tsx                # Question display (Client Component)
│   ├── VoiceInput.tsx                  # Voice recognition UI
│   ├── TextInput.tsx                   # Text input (open/short)
│   ├── FileUpload.tsx                  # File upload UI
│   ├── ProgressBar.tsx                 # Progress indicator
│   ├── NavigationButtons.tsx           # Back/Next buttons
│   ├── ReviewCard.tsx                  # Answer review card
│   └── WelcomeCard.tsx                 # Welcome screen content
│
├── shared/
│   ├── Header.tsx                      # App header
│   ├── LoadingSpinner.tsx              # Loading states
│   ├── ErrorBoundary.tsx               # Error handling
│   └── Toast.tsx                       # Notification system
│
└── ui/                                 # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── dialog.tsx
    ├── progress.tsx
    └── ...
```

### 1.2 Component Design Patterns

**Server vs. Client Components:**

- **Server Components (default):** Page containers, data fetching, static content
- **Client Components (`'use client'`):** Interactive UI, state management, browser APIs

**Pattern: Container/Presentation**

```typescript
// Server Component (Container) - Handles data fetching
// app/admin/dashboard/page.tsx
import DashboardView from '@/components/admin/DashboardView';
import { questionnaireService } from '@/services/questionnaire.service';

export default async function DashboardPage() {
  const questionnaires = await questionnaireService.getAll();
  return <DashboardView questionnaires={questionnaires} />;
}

// Client Component (Presentation) - Handles interactions
// components/admin/DashboardView.tsx
'use client';

export default function DashboardView({ questionnaires }: Props) {
  const [filter, setFilter] = useState('all');
  // Interactive logic here
  return (/* UI */);
}
```

### 1.3 Admin Portal Components

#### 1.3.1 DashboardView Component

**Purpose:** Display all questionnaires with status, actions, and navigation

**Props:**
```typescript
interface DashboardViewProps {
  questionnaires: Array<{
    id: string;
    title: string;
    clientName: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    sessionId: string;
    createdAt: Date;
    questionCount: number;
  }>;
}
```

**States:**
- Default: List of questionnaires
- Empty: No questionnaires created yet
- Loading: Skeleton loaders (handled by Suspense)

**Key Interactions:**
- Click "Create New" → Navigate to `/admin/questionnaire/new`
- Click "Copy URL" → Copy to clipboard, show toast
- Click "Edit" → Navigate to edit page
- Click "View Responses" → Navigate to responses page (if completed)

**Accessibility:**
- Keyboard navigation through questionnaire cards
- ARIA labels on action buttons
- Status badges with sufficient color contrast

---

#### 1.3.2 QuestionnaireEditor Component

**Purpose:** Create/edit questionnaire with questions

**Props:**
```typescript
interface QuestionnaireEditorProps {
  initialData?: {
    id?: string;
    title: string;
    clientName: string;
    questions: Question[];
  };
  mode: 'create' | 'edit';
}
```

**Local State:**
```typescript
const [title, setTitle] = useState('');
const [clientName, setClientName] = useState('');
const [questions, setQuestions] = useState<Question[]>([]);
const [isDirty, setIsDirty] = useState(false);
const [saving, setSaving] = useState(false);
```

**Key Features:**
- Auto-save every 30 seconds (if dirty)
- Manual save button
- Drag-and-drop question reordering (using `@dnd-kit/core`)
- Add/remove/edit questions inline
- CSV upload dialog
- Preview mode (mobile viewport)

**Validation:**
- Title required (min 1 char, max 200)
- Client name required
- At least 1 question required
- Question text required (max 500 chars)

---

#### 1.3.3 QuestionList Component

**Purpose:** Draggable list of questions

**Props:**
```typescript
interface QuestionListProps {
  questions: Question[];
  onReorder: (questions: Question[]) => void;
  onEdit: (index: number, question: Question) => void;
  onDelete: (index: number) => void;
}
```

**Implementation:**
```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function QuestionList({ questions, onReorder, onEdit, onDelete }: Props) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over?.id);
      const reordered = arrayMove(questions, oldIndex, newIndex);
      onReorder(reordered);
    }
  }

  return (
    <DndContext colliders={[closestCenter]} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
        {questions.map((question, index) => (
          <QuestionItem
            key={question.id}
            question={question}
            index={index}
            onEdit={(q) => onEdit(index, q)}
            onDelete={() => onDelete(index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

#### 1.3.4 ResponseViewer Component

**Purpose:** Display submitted questionnaire responses

**Props:**
```typescript
interface ResponseViewerProps {
  questionnaire: {
    title: string;
    clientName: string;
    completedAt: Date;
  };
  responses: Array<{
    questionText: string;
    questionType: QuestionType;
    answerText?: string;
    answerFiles?: FileMetadata[];
    answerUrl?: string;
    inputMethod: 'VOICE' | 'TEXT';
    language: 'EN' | 'ES';
  }>;
}
```

**Features:**
- Accordion view (all expanded by default)
- Badges showing input method (voice/text) and language
- File downloads
- Clickable shared folder URLs
- Export buttons (CSV, Markdown)

---

### 1.4 Client Portal Components

#### 1.4.1 QuestionView Component

**Purpose:** Display single question with voice/text input

**Props:**
```typescript
interface QuestionViewProps {
  sessionId: string;
  question: {
    id: string;
    questionText: string;
    questionType: 'OPEN_ENDED' | 'SHORT_ANSWER' | 'FILE_UPLOAD';
    required: boolean;
  };
  questionNumber: number;
  totalQuestions: number;
  existingResponse?: {
    answerText?: string;
    answerFiles?: any[];
    answerUrl?: string;
  };
}
```

**Local State:**
```typescript
const [answer, setAnswer] = useState('');
const [files, setFiles] = useState<FileMetadata[]>([]);
const [url, setUrl] = useState('');
const [inputMethod, setInputMethod] = useState<'VOICE' | 'TEXT'>('TEXT');
const [language, setLanguage] = useState<'EN' | 'ES'>('EN');
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
```

**Behavior:**
- Auto-save on "Next" click
- Disable "Next" if required question unanswered
- Show "Saved ✓" indicator briefly after save
- Support voice OR text input (user can switch)
- File upload only for FILE_UPLOAD type questions

**Mobile Optimizations:**
- Fixed progress bar at top
- Floating "Next" button at bottom
- Large touch targets (min 44x44px)
- Prevent iOS zoom (font-size >= 16px)

---

#### 1.4.2 VoiceInput Component

**Purpose:** Voice recognition UI with language toggle

**Props:**
```typescript
interface VoiceInputProps {
  onTranscript: (transcript: string, language: 'EN' | 'ES') => void;
  currentTranscript?: string;
}
```

**Local State:**
```typescript
const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'es-ES'>('en-US');
const {
  isListening,
  transcript,
  interimTranscript,
  error,
  isSupported,
  startListening,
  stopListening,
  resetTranscript
} = useVoiceRecognition({ language: selectedLanguage });
```

**UI States:**
1. **Idle:** "Tap to Speak" button (blue)
2. **Listening:** "Stop Recording" button (red, pulsing)
3. **Transcribing:** Blue card showing interim text (gray) + final text (black)
4. **Complete:** Gray card showing editable transcript
5. **Error:** Red card with error message + fallback guidance
6. **Unsupported:** Yellow warning card directing to text input

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│  [Mic Icon] Tap to Speak (Button)  │  ← PRIMARY
├─────────────────────────────────────┤
│  [EN] [ES] Language Toggle          │  ← Language selector
├─────────────────────────────────────┤
│  [Listening...] (if active)         │
│  "We primarily sell through..."     │  ← Real-time transcription
└─────────────────────────────────────┘
```

---

#### 1.4.3 FileUpload Component

**Purpose:** File upload with drag-drop + shared folder URL

**Props:**
```typescript
interface FileUploadProps {
  files: FileMetadata[];
  url: string;
  onFilesChange: (files: FileMetadata[]) => void;
  onUrlChange: (url: string) => void;
}
```

**Features:**
- Drag-and-drop zone (desktop)
- File picker (mobile-friendly)
- Progress indicator during upload
- File size validation (50MB max)
- MIME type validation
- Multiple file support
- Remove uploaded files
- Shared folder URL input (Dropbox, Google Drive)

**Upload Flow:**
1. User selects file(s)
2. Upload to backend API endpoint via multipart/form-data
3. Backend handles Supabase Storage interaction
4. Backend returns file metadata
5. Store file metadata in local state
6. Parent component saves to database

---

### 1.5 Shared Components

#### 1.5.1 ProgressBar Component

**Purpose:** Visual progress indicator for questionnaire

**Props:**
```typescript
interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}
```

**Display:**
```
Question 5 of 15                    33% complete
[████████░░░░░░░░░░░░░░]
```

**Styling:**
- Tailwind `bg-blue-600` for filled portion
- `bg-gray-200` for unfilled
- Sticky positioning at top (mobile)

---

#### 1.5.2 NavigationButtons Component

**Purpose:** Consistent Back/Next navigation

**Props:**
```typescript
interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isLastQuestion: boolean;
  saving?: boolean;
  backDisabled?: boolean;
}
```

**Rendering:**
```tsx
<div className="flex justify-between">
  <Button variant="outline" onClick={onBack} disabled={backDisabled}>
    <ArrowLeft className="w-4 h-4 mr-2" />
    Back
  </Button>

  <Button onClick={onNext} disabled={!canProceed || saving} size="lg">
    {saving ? 'Saving...' : isLastQuestion ? 'Review Answers' : 'Next'}
    {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
  </Button>
</div>
```

---

## 2. State Management

### 2.1 State Management Strategy

**Philosophy:** Keep it simple. Use local state by default, elevate only when needed.

**State Layers:**
1. **Local Component State:** `useState`, `useReducer` for component-specific UI
2. **URL State:** Next.js routing params for navigation
3. **Server State:** React Query for API data (caching, refetching)
4. **Client Storage:** IndexedDB for offline queue

**No Global State Library Needed:** The app has minimal cross-component state needs. Each page is largely self-contained.

---

### 2.2 Local State Patterns

#### Pattern 1: Form State

```typescript
// components/admin/QuestionnaireEditor.tsx
'use client';

export default function QuestionnaireEditor({ initialData }: Props) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    clientName: initialData?.clientName || '',
    questions: initialData?.questions || [],
  });

  const [isDirty, setIsDirty] = useState(false);

  function updateField<K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  // Auto-save effect
  useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      saveQuestionnaire(formData);
      setIsDirty(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timeout);
  }, [formData, isDirty]);

  return (/* ... */);
}
```

#### Pattern 2: Async Action State

```typescript
// components/client/QuestionView.tsx
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
const [error, setError] = useState<string | null>(null);

async function saveAnswer() {
  setSaving(true);
  setError(null);

  try {
    await fetch(`/api/intake/${sessionId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ /* ... */ }),
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000); // Hide after 2s
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save');
  } finally {
    setSaving(false);
  }
}
```

---

### 2.3 Session Persistence (IndexedDB)

**Use Case:** Offline queue for responses when network unavailable

**Implementation:**
```typescript
// lib/storage/offline-queue.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineQueueDB extends DBSchema {
  'pending-responses': {
    key: string; // questionId
    value: {
      questionId: string;
      sessionId: string;
      answer: any;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<OfflineQueueDB>;

export async function initOfflineQueue() {
  db = await openDB<OfflineQueueDB>('intake-form-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pending-responses', { keyPath: 'questionId' });
    },
  });
}

export async function queueResponse(data: {
  questionId: string;
  sessionId: string;
  answer: any;
}) {
  await db.put('pending-responses', {
    ...data,
    timestamp: Date.now(),
  });
}

export async function getPendingResponses() {
  return db.getAll('pending-responses');
}

export async function clearPendingResponse(questionId: string) {
  await db.delete('pending-responses', questionId);
}
```

**Hook for Syncing:**
```typescript
// hooks/useOfflineSync.ts
import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { getPendingResponses, clearPendingResponse } from '@/lib/storage/offline-queue';

export function useOfflineSync(sessionId: string) {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) return;

    async function syncPending() {
      const pending = await getPendingResponses();

      for (const item of pending) {
        try {
          await fetch(`/api/intake/${sessionId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: item.questionId,
              answer: item.answer,
            }),
          });

          await clearPendingResponse(item.questionId);
        } catch (error) {
          console.error('Sync failed for', item.questionId, error);
          // Leave in queue for next attempt
        }
      }
    }

    syncPending();
  }, [isOnline, sessionId]);
}
```

---

### 2.4 Network Status Detection

```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

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

**Usage in QuestionView:**
```typescript
const isOnline = useNetworkStatus();

async function saveAnswer() {
  if (!isOnline) {
    // Queue for later sync
    await queueResponse({ questionId, sessionId, answer });
    showToast('Saved locally. Will sync when online.');
    return;
  }

  // Normal save flow
}
```

---

## 3. Voice Input Implementation

### 3.1 useVoiceRecognition Hook (Core)

**File:** `/src/hooks/useVoiceRecognition.ts`

**Purpose:** Abstract Web Speech API into reusable hook

**API:**
```typescript
interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;           // Final transcript
  interimTranscript: string;    // Real-time partial transcript
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

function useVoiceRecognition(options: {
  continuous?: boolean;
  interimResults?: boolean;
  language?: 'en-US' | 'es-ES' | 'es-MX';
}): UseVoiceRecognitionReturn
```

**Key Implementation Details:**

1. **Browser Compatibility Check:**
```typescript
const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

setIsSupported(!!SpeechRecognition);
```

2. **Event Handling:**
```typescript
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

  if (final) setTranscript(prev => prev + final);
  setInterimTranscript(interim);
};
```

3. **Error Mapping:**
```typescript
recognition.onerror = (event) => {
  const errorMessages = {
    'no-speech': 'No speech detected. Please try again.',
    'audio-capture': 'Microphone not accessible.',
    'not-allowed': 'Microphone permission denied.',
    'network': 'Network error. Check connection.',
  };
  setError(errorMessages[event.error] || 'Speech recognition error.');
};
```

---

### 3.2 VoiceInput Component (UI)

**Visual States:**

**State 1: Idle (Not Listening)**
```
┌───────────────────────────────────┐
│  [🎤] Tap to Speak                │  (Blue button)
├───────────────────────────────────┤
│  [English] [Español]              │  (Language toggle)
└───────────────────────────────────┘
```

**State 2: Listening**
```
┌───────────────────────────────────┐
│  [🔴] Stop Recording              │  (Red button, pulsing)
├───────────────────────────────────┤
│  Listening...                     │  (Blue card)
│  "We primarily sell..."           │  (Gray interim text)
└───────────────────────────────────┘
```

**State 3: Transcript Ready**
```
┌───────────────────────────────────┐
│  [🎤] Re-record   [↻] Reset       │
├───────────────────────────────────┤
│  Your recording:                  │  (Gray card)
│  "We primarily sell through       │  (Black final text)
│   agricultural co-ops..."         │
└───────────────────────────────────┘
```

**State 4: Error**
```
┌───────────────────────────────────┐
│  ⚠️ Microphone permission denied  │  (Red card)
│  Enable in browser settings.      │
│  Or use text input below.         │
└───────────────────────────────────┘
```

**State 5: Unsupported Browser**
```
┌───────────────────────────────────┐
│  ℹ️ Voice input not supported     │  (Yellow card)
│  in your browser. Please use      │
│  Chrome or Safari.                │
└───────────────────────────────────┘
```

---

### 3.3 Language Switching

**Implementation:**
```typescript
const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'es-ES'>('en-US');

// Initialize from browser language
useEffect(() => {
  const browserLang = navigator.language;
  if (browserLang.startsWith('es')) {
    setSelectedLanguage('es-ES');
  }
}, []);

// Language toggle buttons
<div className="flex gap-2">
  <Button
    variant={selectedLanguage === 'en-US' ? 'default' : 'outline'}
    onClick={() => setSelectedLanguage('en-US')}
    disabled={isListening}
  >
    English
  </Button>
  <Button
    variant={selectedLanguage === 'es-ES' ? 'default' : 'outline'}
    onClick={() => setSelectedLanguage('es-ES')}
    disabled={isListening}
  >
    Español
  </Button>
</div>
```

**Persistence:**
```typescript
// Save language preference to localStorage
useEffect(() => {
  localStorage.setItem('voice-language', selectedLanguage);
}, [selectedLanguage]);

// Restore on mount
const savedLanguage = localStorage.getItem('voice-language');
if (savedLanguage) setSelectedLanguage(savedLanguage);
```

---

### 3.4 Fallback to Text Input

**Strategy:** Always show text input as alternative

```typescript
export default function QuestionView({ question }: Props) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const { isSupported } = useVoiceRecognition();

  // Auto-fallback if voice not supported
  useEffect(() => {
    if (!isSupported) setInputMode('text');
  }, [isSupported]);

  return (
    <>
      {isSupported && inputMode === 'voice' && (
        <VoiceInput onTranscript={setAnswer} />
      )}

      <div className="space-y-2">
        <label className="text-sm text-gray-600">
          {isSupported ? 'Or type your response:' : 'Type your response:'}
        </label>
        <Textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setInputMode('text'); // Switch to text mode
          }}
        />
      </div>

      {isSupported && (
        <Button
          variant="link"
          onClick={() => setInputMode(mode => mode === 'voice' ? 'text' : 'voice')}
        >
          {inputMode === 'voice' ? 'Type instead' : 'Use voice instead'}
        </Button>
      )}
    </>
  );
}
```

---

## 4. Mobile-First UI/UX

### 4.1 Responsive Layouts (Tailwind)

**Breakpoint Strategy:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',   // Tablet portrait
      'md': '768px',   // Tablet landscape
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
    },
  },
}
```

**Mobile-First Classes:**
```tsx
<div className="
  px-4           {/* Mobile: 16px padding */}
  sm:px-6        {/* Tablet: 24px */}
  lg:px-8        {/* Desktop: 32px */}
  max-w-3xl      {/* Max width for readability */}
  mx-auto        {/* Center container */}
">
```

---

### 4.2 Touch-Friendly Interactions

**Minimum Touch Target: 44x44px (Apple HIG)**

```tsx
// components/ui/button.tsx
const sizeVariants = {
  sm: 'h-10 px-4',      // 40px height (acceptable for secondary)
  default: 'h-11 px-6', // 44px height (primary actions)
  lg: 'h-12 px-8',      // 48px height (CTA buttons)
};
```

**Examples:**
```tsx
// Primary action (Next button)
<Button size="lg" className="min-w-[120px]">
  Next
</Button>

// Voice button (large touch target)
<Button size="lg" className="w-full py-6">
  <Mic className="w-6 h-6 mr-2" />
  Tap to Speak
</Button>
```

---

### 4.3 Progressive Disclosure

**Pattern: One Question at a Time**

```
Step 1: Welcome Screen
┌─────────────────────────────┐
│  Welcome!                   │
│  [Start Questionnaire]      │
└─────────────────────────────┘

Step 2: Question 1
┌─────────────────────────────┐
│  Progress: 1 of 15 (7%)     │
├─────────────────────────────┤
│  Question 1                 │
│  [Voice Input]              │
│  [Back] [Next]              │
└─────────────────────────────┘

Step 3: Question 2
┌─────────────────────────────┐
│  Progress: 2 of 15 (13%)    │
├─────────────────────────────┤
│  Question 2                 │
│  ...                        │
└─────────────────────────────┘

Step N: Review
┌─────────────────────────────┐
│  Review Your Answers        │
│  [Q1: Answer...]            │
│  [Q2: Answer...]            │
│  [Submit]                   │
└─────────────────────────────┘
```

**Benefits:**
- Focus: One task at a time
- Progress: Visual momentum
- Less overwhelming: Can't see all 15 questions at once

---

### 4.4 Loading & Error States

#### Loading States

**Pattern 1: Skeleton Loaders**
```tsx
// components/admin/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Usage with Suspense
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardView />
</Suspense>
```

**Pattern 2: Inline Spinners**
```tsx
<Button disabled={saving}>
  {saving ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

#### Error States

**Pattern 1: Inline Errors**
```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

**Pattern 2: Error Boundary**
```tsx
// components/shared/ErrorBoundary.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.5 One-Question-at-a-Time UI

**Layout Structure:**
```tsx
<div className="min-h-screen bg-gray-50 py-8 px-4">
  <div className="container mx-auto max-w-3xl space-y-4">
    {/* Sticky Progress Bar */}
    <div className="sticky top-0 bg-gray-50 py-4 z-10">
      <ProgressBar current={questionNumber} total={totalQuestions} />
    </div>

    {/* Question Card */}
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{question.questionText}</h2>
      </CardHeader>
      <CardContent>
        {/* Input components */}
      </CardContent>
    </Card>

    {/* Fixed Navigation at Bottom */}
    <Card className="sticky bottom-4">
      <CardContent className="pt-6">
        <NavigationButtons {...navProps} />
      </CardContent>
    </Card>
  </div>
</div>
```

**Mobile Optimizations:**
- Sticky progress bar (always visible)
- Sticky navigation (bottom of viewport)
- No horizontal scrolling
- Touch-friendly spacing

---

## 5. Admin Portal Features

### 5.1 Dashboard

**Component:** `DashboardView.tsx`

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Admin Dashboard              [Logout]      │  ← Header
├─────────────────────────────────────────────┤
│  Questionnaires    [Create New]             │  ← Section header
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │ Client Intake - Acme AgTech         │   │  ← Questionnaire card
│  │ Client: Acme AgTech Inc.            │   │
│  │ Status: [Completed] (green badge)   │   │
│  │ Created 2 days ago                  │   │
│  │ [Copy URL] [Edit] [View Responses]  │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Client Intake - Beta Corp           │   │
│  │ Status: [In Progress] (yellow)      │   │
│  │ ...                                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Status Color Coding:**
```typescript
function getStatusColor(status: QuestionnaireStatus) {
  return {
    NOT_STARTED: 'bg-gray-200 text-gray-700',
    IN_PROGRESS: 'bg-yellow-200 text-yellow-800',
    COMPLETED: 'bg-green-200 text-green-800',
  }[status];
}
```

**Sorting:**
- Default: Most recent first (`createdAt DESC`)
- Future: Filter by status, search by client name

---

### 5.2 CSV Upload Interface

**Component:** `CSVUploadDialog.tsx`

**UI Flow:**
```
1. Click "Upload CSV" button
   ↓
2. Dialog opens with file picker
   ↓
3. User selects .csv file
   ↓
4. Parse CSV, validate format
   ↓
5a. Success: Display questions, allow review/edit
5b. Error: Show specific error with row numbers
   ↓
6. Click "Import" to add to editor
```

**Implementation:**
```typescript
import Papa from 'papaparse';

async function handleFileSelect(file: File) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const { data, errors } = results;

      if (errors.length > 0) {
        setError(`CSV parsing failed: ${errors[0].message}`);
        return;
      }

      // Validate columns
      const requiredColumns = ['question_text', 'question_type', 'required'];
      const columns = Object.keys(data[0] || {});
      const missing = requiredColumns.filter(col => !columns.includes(col));

      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(', ')}`);
        return;
      }

      // Transform to Question format
      const questions = data.map((row: any, index: number) => ({
        questionText: row.question_text,
        questionType: row.question_type?.toUpperCase() || 'OPEN_ENDED',
        required: row.required === 'true' || row.required === true,
        order: index,
      }));

      onQuestionsImported(questions);
    },
  });
}
```

**CSV Template:**
```csv
question_text,question_type,required
"Describe your business",open_ended,true
"Annual revenue?",short_answer,true
"Upload financials",file_upload,false
```

---

### 5.3 Question Editor

**Component:** `QuestionnaireEditor.tsx`

**Features:**
1. **Inline editing** - Click question text to edit
2. **Drag-to-reorder** - Using `@dnd-kit/core`
3. **Add question** - Button at bottom
4. **Delete question** - Trash icon with confirmation
5. **Question type dropdown** - OPEN_ENDED | SHORT_ANSWER | FILE_UPLOAD
6. **Required toggle** - Checkbox per question
7. **Auto-save** - Every 30 seconds if dirty
8. **Manual save** - Button in header

**Question Item Layout:**
```
┌─────────────────────────────────────────────┐
│ [≡] Question 1                    [Required]│  ← Drag handle + toggle
├─────────────────────────────────────────────┤
│ Describe your agricultural business...     │  ← Editable text
├─────────────────────────────────────────────┤
│ Type: [Open-ended ▼]              [🗑 Del] │  ← Dropdown + delete
└─────────────────────────────────────────────┘
```

---

### 5.4 Response Viewer

**Component:** `ResponseViewer.tsx`

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Client Intake - Acme AgTech                │
│  Completed: Jan 16, 2026                    │
│  [Export CSV] [Export Markdown]             │  ← Export buttons
├─────────────────────────────────────────────┤
│  Q1: Describe your business                 │  ← Accordion (expanded)
│  ┌───────────────────────────────────────┐ │
│  │ A: "We're a precision ag SaaS..."    │ │
│  │ [Voice 🎤] [English 🇺🇸]              │ │  ← Badges
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Q2: Annual revenue?                        │
│  ┌───────────────────────────────────────┐ │
│  │ A: "$2.5M ARR"                        │ │
│  │ [Text ⌨️] [English 🇺🇸]               │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Q3: Upload financials                      │
│  ┌───────────────────────────────────────┐ │
│  │ [📄 financials.pdf] (Download)        │ │ ← Signed URL from backend
│  │ [🔗 Google Drive Folder]              │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### 5.5 Export Functionality

**CSV Export:**
```typescript
function exportToCSV(responses: Response[]) {
  const rows = responses.map(r => ({
    Question: r.question.questionText,
    Answer: r.answerText || r.answerUrl || '[File uploaded]',
    'Input Method': r.inputMethod,
    Language: r.language,
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${clientName}_intake_${date}.csv`;
  a.click();
}
```

**Markdown Export:**
```typescript
function exportToMarkdown(questionnaire: Questionnaire, responses: Response[]) {
  let markdown = `# Client Intake Transcript\n\n`;
  markdown += `**Client:** ${questionnaire.clientName}\n`;
  markdown += `**Completed:** ${formatDate(questionnaire.completedAt)}\n\n`;
  markdown += `---\n\n`;

  responses.forEach(r => {
    markdown += `Q: ${r.question.questionText}\n\n`;

    if (r.answerText) {
      markdown += `A: ${r.answerText}\n\n`;
    }

    if (r.answerFiles?.length) {
      r.answerFiles.forEach(file => {
        markdown += `[File: ${file.fileName}](${file.fileUrl})\n`;
      });
      markdown += `\n`;
    }

    if (r.answerUrl) {
      markdown += `[Shared Folder: ${r.answerUrl}]\n\n`;
    }

    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${questionnaire.clientName}_intake_transcript_${date}.md`;
  a.click();
}
```

---

## 6. Client Portal Features

### 6.1 Welcome Screen

**Component:** `WelcomeCard.tsx`

**Content:**
```
┌─────────────────────────────────────────┐
│  Welcome!                               │
├─────────────────────────────────────────┤
│  Client Intake - Acme AgTech            │
│  For: Acme AgTech Inc.                  │
│                                         │
│  This questionnaire will help us...     │
│                                         │
│  • 15 questions                         │
│  • 15-30 minutes                        │
│  • Speak or type answers                │
│  • Progress saved automatically         │
│                                         │
│  [Start Questionnaire]                  │  ← Large CTA
└─────────────────────────────────────────┘
```

**Purpose:**
- Set expectations (time, question count)
- Explain voice feature
- Reduce anxiety (auto-save mentioned)
- Single clear action (Start)

---

### 6.2 Question Display

**Handled by:** `QuestionView.tsx`

**Input Method Selection:**
```typescript
// Determine input component based on question type
{question.questionType === 'FILE_UPLOAD' ? (
  <FileUpload {...fileProps} />
) : question.questionType === 'SHORT_ANSWER' ? (
  <>
    <VoiceInput {...voiceProps} />
    <Input {...textProps} />
  </>
) : (
  <>
    <VoiceInput {...voiceProps} />
    <Textarea {...textProps} />
  </>
)}
```

---

### 6.3 Voice/Text Input Interface

**Dual-Mode Design:**
```
┌─────────────────────────────────────────┐
│  [🎤] Tap to Speak                      │  ← Voice (Primary)
│  [English] [Español]                    │
├─────────────────────────────────────────┤
│  Or type your response:                 │  ← Text (Fallback)
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**User can switch freely:**
- Start with voice, then edit text
- Start typing, then switch to voice
- Last-used method tracked in response metadata

---

### 6.4 File Upload

**Component:** `FileUpload.tsx`

**Features:**
- Drag-and-drop zone (desktop)
- File picker button (mobile)
- Progress bar during upload
- File list with remove option
- Shared folder URL input

**Mobile Considerations:**
- Large drop zone (min 100px height)
- Clear tap target for file picker
- Progress feedback (visual + text)

---

### 6.5 Progress Indicator

**Component:** `ProgressBar.tsx`

**Display:**
```tsx
<div className="sticky top-0 bg-gray-50 py-4 z-10">
  <div className="flex justify-between text-sm text-gray-600 mb-2">
    <span>Question {current} of {total}</span>
    <span>{Math.round((current / total) * 100)}% complete</span>
  </div>
  <Progress value={(current / total) * 100} />
</div>
```

**Sticky Positioning:**
- Always visible during scroll
- Provides constant context
- Motivational (progress visible)

---

### 6.6 Review & Submit

**Component:** `ReviewScreen.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Review Your Answers                    │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │ Q1: Describe your business        │ │
│  │ A: "We're a precision ag..."      │ │
│  │                         [Edit]    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Q2: Annual revenue?               │ │
│  │ A: "$2.5M ARR"                    │ │
│  │                         [Edit]    │ │
│  └───────────────────────────────────┘ │
│  ...                                    │
├─────────────────────────────────────────┤
│  [Back to Questions] [Submit]           │  ← Final CTA
└─────────────────────────────────────────┘
```

**Submit Confirmation:**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button size="lg">Submit</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Ready to submit?</AlertDialogTitle>
      <AlertDialogDescription>
        You won't be able to make changes after submission.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Go Back</AlertDialogCancel>
      <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Success Screen:**
```
┌─────────────────────────────────────────┐
│  ✓ Thank You!                           │
│                                         │
│  Your responses have been submitted     │
│  to [Consultant Name].                  │
│                                         │
│  Next steps:                            │
│  • You'll receive a confirmation email │
│  • We'll review your responses          │
│  • Our team will contact you within    │
│    2 business days                      │
└─────────────────────────────────────────┘
```

---

## 7. Routing & Navigation

### 7.1 Next.js App Router Structure

```
app/
├── page.tsx                             # Home (redirect to /admin)
├── layout.tsx                           # Root layout (fonts, providers)
│
├── admin/
│   ├── layout.tsx                       # Admin layout (header, auth check)
│   ├── login/
│   │   └── page.tsx                     # GET /admin/login
│   ├── dashboard/
│   │   └── page.tsx                     # GET /admin/dashboard
│   └── questionnaire/
│       ├── new/
│       │   └── page.tsx                 # GET /admin/questionnaire/new
│       └── [id]/
│           ├── edit/
│           │   └── page.tsx             # GET /admin/questionnaire/:id/edit
│           └── responses/
│               └── page.tsx             # GET /admin/questionnaire/:id/responses
│
└── intake/
    └── [sessionId]/
        ├── page.tsx                     # GET /intake/:sessionId (Welcome)
        ├── q/
        │   └── [number]/
        │       └── page.tsx             # GET /intake/:sessionId/q/:number
        ├── review/
        │   └── page.tsx                 # GET /intake/:sessionId/review
        └── complete/
            └── page.tsx                 # GET /intake/:sessionId/complete
```

---

### 7.2 Admin Routes (Protected)

**Middleware Protection:**
```typescript
// middleware.ts
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

**Redirect Unauthenticated:**
```typescript
// app/admin/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  // Render dashboard
}
```

---

### 7.3 Client Routes (Session-Based)

**No Authentication Required**

**Session Validation:**
```typescript
// app/intake/[sessionId]/page.tsx
import { notFound } from 'next/navigation';

export default async function IntakePage({ params }: Props) {
  const questionnaire = await questionnaireRepository.findBySessionId(
    params.sessionId
  );

  if (!questionnaire) {
    notFound(); // Shows 404 page
  }

  // Render welcome screen
}
```

**Status-Based Redirects:**
```typescript
if (questionnaire.status === 'COMPLETED') {
  redirect(`/intake/${params.sessionId}/complete`);
}
```

---

### 7.4 URL Parameter Handling

**Dynamic Routes:**
```typescript
// app/intake/[sessionId]/q/[number]/page.tsx
export default async function QuestionPage({
  params
}: {
  params: { sessionId: string; number: string }
}) {
  const questionNumber = parseInt(params.number);

  if (isNaN(questionNumber) || questionNumber < 1) {
    notFound();
  }

  const questionnaire = await getQuestionnaire(params.sessionId);
  const question = questionnaire.questions[questionNumber - 1];

  if (!question) {
    // Beyond last question → redirect to review
    redirect(`/intake/${params.sessionId}/review`);
  }

  return <QuestionView {...props} />;
}
```

**Navigation Functions:**
```typescript
// components/client/QuestionView.tsx
const router = useRouter();

function handleNext() {
  if (isLastQuestion) {
    router.push(`/intake/${sessionId}/review`);
  } else {
    router.push(`/intake/${sessionId}/q/${questionNumber + 1}`);
  }
}

function handleBack() {
  if (questionNumber === 1) {
    router.push(`/intake/${sessionId}`); // Back to welcome
  } else {
    router.push(`/intake/${sessionId}/q/${questionNumber - 1}`);
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Project Setup (Days 1-2)
**Complexity:** Simple

**Tasks:**
1. Initialize Next.js 14 project with TypeScript
2. Install dependencies (Tailwind, shadcn/ui, NextAuth, Prisma)
3. Configure shadcn/ui components
4. Set up folder structure
5. Create environment variables template

**Deliverables:**
- `/package.json` with all dependencies
- `/src/components/ui/` with base components
- `/tailwind.config.ts` configured

---

### Phase 2: Authentication & Admin Layout (Days 3-4)
**Complexity:** Medium

**Dependencies:** Phase 1 complete

**Tasks:**
1. Configure NextAuth.js with credentials provider
2. Create admin login page
3. Create admin layout with header/logout
4. Set up middleware for route protection
5. Test login flow

**Deliverables:**
- `/app/admin/login/page.tsx`
- `/app/admin/layout.tsx`
- `/middleware.ts`
- Working admin authentication

---

### Phase 3: Admin Dashboard (Days 5-7)
**Complexity:** Medium

**Dependencies:** Phase 2 complete, Backend API ready

**Tasks:**
1. Create `DashboardView` component
2. Create `QuestionnaireCard` component
3. Fetch questionnaires from API
4. Implement "Copy URL" functionality
5. Add empty state
6. Add loading state (Suspense + skeleton)

**Deliverables:**
- `/components/admin/DashboardView.tsx`
- `/components/admin/QuestionnaireCard.tsx`
- Functional dashboard with questionnaire list

---

### Phase 4: Questionnaire Editor (Days 8-12)
**Complexity:** Complex

**Dependencies:** Phase 3 complete

**Tasks:**
1. Create `QuestionnaireEditor` component
2. Create `QuestionList` with drag-and-drop (`@dnd-kit`)
3. Create `QuestionItem` with inline editing
4. Implement add/delete question
5. Implement question type dropdown
6. Implement required toggle
7. Create `CSVUploadDialog` with Papa Parse
8. Implement auto-save (30-second interval)
9. Add validation

**Deliverables:**
- `/components/admin/QuestionnaireEditor.tsx`
- `/components/admin/QuestionList.tsx`
- `/components/admin/QuestionItem.tsx`
- `/components/admin/CSVUploadDialog.tsx`
- Full question editing capability

---

### Phase 5: Client Welcome & Layout (Days 13-14)
**Complexity:** Simple

**Dependencies:** Backend API ready

**Tasks:**
1. Create intake welcome page
2. Create `WelcomeCard` component
3. Implement session validation
4. Add "Start" button navigation
5. Add 404 handling for invalid sessions

**Deliverables:**
- `/app/intake/[sessionId]/page.tsx`
- `/components/client/WelcomeCard.tsx`
- Working welcome screen

---

### Phase 6: Question Display UI (Days 15-18)
**Complexity:** Complex

**Dependencies:** Phase 5 complete

**Tasks:**
1. Create `QuestionView` component (container)
2. Create `ProgressBar` component
3. Create `NavigationButtons` component
4. Create `TextInput` component (Textarea/Input variants)
5. Implement save logic (API call)
6. Implement navigation (Next/Back)
7. Implement validation (required questions)
8. Add loading/saved indicators

**Deliverables:**
- `/components/client/QuestionView.tsx`
- `/components/client/ProgressBar.tsx`
- `/components/client/NavigationButtons.tsx`
- `/components/client/TextInput.tsx`
- Working question-by-question flow (text input only)

---

### Phase 7: Voice Input (Days 19-22)
**Complexity:** Complex

**Dependencies:** Phase 6 complete

**Tasks:**
1. Create `useVoiceRecognition` hook
2. Create `VoiceInput` component
3. Implement browser compatibility check
4. Implement language toggle (EN/ES)
5. Implement real-time transcription display
6. Implement error handling
7. Add "Re-record" and "Reset" functionality
8. Integrate with `QuestionView`
9. Test on iOS Safari, Chrome Mobile

**Deliverables:**
- `/hooks/useVoiceRecognition.ts`
- `/components/client/VoiceInput.tsx`
- Working voice input with fallback

---

### Phase 8: File Upload (Days 23-25)
**Complexity:** Medium

**Dependencies:** Phase 6 complete, Backend file upload API endpoint ready

**Tasks:**
1. Create `FileUpload` component
2. Implement file picker
3. Implement drag-and-drop (desktop)
4. Implement multipart/form-data upload to backend API
5. Backend handles Supabase Storage interaction
6. Add progress indicator
7. Add file size/type validation (client-side pre-check)
8. Implement shared folder URL input
9. Add remove file functionality

**Deliverables:**
- `/components/client/FileUpload.tsx`
- Working file upload via backend to Supabase Storage

---

### Phase 9: Review & Submit (Days 26-28)
**Complexity:** Medium

**Dependencies:** Phase 6-8 complete

**Tasks:**
1. Create review page
2. Create `ReviewCard` component
3. Fetch all responses
4. Display answers with edit links
5. Implement submit confirmation dialog
6. Implement submit API call
7. Create success screen
8. Add validation (check required questions)

**Deliverables:**
- `/app/intake/[sessionId]/review/page.tsx`
- `/app/intake/[sessionId]/complete/page.tsx`
- `/components/client/ReviewCard.tsx`
- Complete submission flow

---

### Phase 10: Offline Sync (Days 29-31)
**Complexity:** Complex

**Dependencies:** Phase 9 complete

**Tasks:**
1. Install `idb` library
2. Create `offline-queue.ts` utilities
3. Create `useNetworkStatus` hook
4. Create `useOfflineSync` hook
5. Integrate offline queue into save logic
6. Add online/offline indicator
7. Test offline/online transitions
8. Add error recovery

**Deliverables:**
- `/lib/storage/offline-queue.ts`
- `/hooks/useNetworkStatus.ts`
- `/hooks/useOfflineSync.ts`
- Working offline support

---

### Phase 11: Response Viewer & Export (Days 32-35)
**Complexity:** Medium

**Dependencies:** Phase 3 complete

**Tasks:**
1. Create response viewer page
2. Create `ResponseViewer` component
3. Fetch responses from API
4. Display answers in accordion
5. Add input method/language badges
6. Create CSV export function
7. Create Markdown export function
8. Add export buttons
9. Test export formats

**Deliverables:**
- `/app/admin/questionnaire/[id]/responses/page.tsx`
- `/components/admin/ResponseViewer.tsx`
- `/components/admin/ExportButtons.tsx`
- Working response viewing and export

---

### Phase 12: Polish & Testing (Days 36-40)
**Complexity:** Medium

**Dependencies:** All phases complete

**Tasks:**
1. Mobile responsiveness audit (test on real devices)
2. Accessibility audit (keyboard nav, screen readers)
3. Error message review (user-friendly)
4. Loading state polish
5. Voice input testing (Spanish accuracy)
6. Cross-browser testing
7. Performance optimization (Lighthouse)
8. Fix bugs from testing
9. Documentation

**Deliverables:**
- Bug-free application
- Lighthouse score >90
- WCAG 2.1 AA compliant
- Tested on iOS Safari, Chrome Mobile

---

## 9. Testing Strategy

### 9.1 Component Testing (React Testing Library)

**Setup:**
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

**Example Test:**
```typescript
// components/client/__tests__/ProgressBar.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('displays current question and percentage', () => {
    render(<ProgressBar current={5} total={15} />);

    expect(screen.getByText('Question 5 of 15')).toBeInTheDocument();
    expect(screen.getByText('33% complete')).toBeInTheDocument();
  });

  it('renders progress bar with correct value', () => {
    const { container } = render(<ProgressBar current={5} total={15} />);

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');
  });
});
```

---

### 9.2 Integration Tests

**Testing User Flows:**
```typescript
// __tests__/client-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Client Questionnaire Flow', () => {
  beforeEach(() => {
    // Mock API responses
    global.fetch = vi.fn();
  });

  it('completes questionnaire flow', async () => {
    const user = userEvent.setup();

    // 1. Load welcome screen
    render(<IntakeWelcomePage sessionId="test123" />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();

    // 2. Click start
    await user.click(screen.getByText('Start Questionnaire'));

    // 3. Answer first question
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Type your answer...');
    await user.type(textarea, 'My test answer');

    // 4. Click next
    await user.click(screen.getByText('Next'));

    // 5. Verify navigation to Q2
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });
  });
});
```

---

### 9.3 Voice API Mocking

**Mock Web Speech API:**
```typescript
// __tests__/setup.ts
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult = null;
  onerror = null;
  onend = null;

  start() {
    // Simulate speech recognition result after 1s
    setTimeout(() => {
      if (this.onresult) {
        this.onresult({
          results: [
            [{ transcript: 'This is a test transcript', isFinal: true }]
          ],
          resultIndex: 0,
        });
      }
      if (this.onend) this.onend();
    }, 1000);
  }

  stop() {
    if (this.onend) this.onend();
  }
}

(global as any).webkitSpeechRecognition = MockSpeechRecognition;
```

**Test Voice Component:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceInput from '../VoiceInput';

describe('VoiceInput', () => {
  it('starts and stops recording', async () => {
    const user = userEvent.setup();
    const onTranscript = vi.fn();

    render(<VoiceInput onTranscript={onTranscript} />);

    // Click to start
    await user.click(screen.getByText('Tap to Speak'));
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();

    // Wait for transcript
    await waitFor(() => {
      expect(onTranscript).toHaveBeenCalledWith(
        'This is a test transcript',
        'EN'
      );
    });
  });
});
```

---

### 9.4 Mobile Responsiveness Testing

**Visual Regression Tests (Playwright):**
```typescript
// e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('question view is mobile-friendly', async ({ page }) => {
  await page.goto('/intake/test-session/q/1');

  // Check touch targets are large enough
  const nextButton = page.getByRole('button', { name: 'Next' });
  const box = await nextButton.boundingBox();

  expect(box?.height).toBeGreaterThanOrEqual(44); // 44px min
  expect(box?.width).toBeGreaterThanOrEqual(120);

  // Check no horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

  expect(scrollWidth).toBe(clientWidth);

  // Screenshot comparison
  await expect(page).toHaveScreenshot('question-mobile.png');
});
```

**Manual Testing Checklist:**
- [ ] iOS Safari (iPhone 12, 13, 14)
- [ ] Chrome Mobile (Android)
- [ ] Landscape orientation
- [ ] Voice input works on mobile
- [ ] File upload works on mobile
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling
- [ ] Sticky header/footer work correctly

---

## 10. Key Implementation Notes

### 10.1 Code Organization Best Practices

1. **Colocate related files:**
```
components/
  client/
    QuestionView/
      QuestionView.tsx
      QuestionView.test.tsx
      QuestionView.module.css (if needed)
      index.ts (export)
```

2. **Use barrel exports:**
```typescript
// components/client/index.ts
export { default as QuestionView } from './QuestionView';
export { default as VoiceInput } from './VoiceInput';
export { default as FileUpload } from './FileUpload';

// Import usage:
import { QuestionView, VoiceInput } from '@/components/client';
```

3. **Separate concerns:**
- UI components in `components/`
- Business logic in `hooks/` and `lib/`
- API calls in `lib/api/`
- Types in `types/`

---

### 10.2 Performance Optimizations

**1. Code Splitting:**
```typescript
// Lazy load admin components (not needed for client)
const AdminDashboard = lazy(() => import('@/components/admin/Dashboard'));
const QuestionEditor = lazy(() => import('@/components/admin/QuestionEditor'));

<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

**2. Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Company Logo"
  width={200}
  height={60}
  priority // Above-the-fold
/>
```

**3. Prefetching:**
```typescript
// Prefetch next question on mount
useEffect(() => {
  if (questionNumber < totalQuestions) {
    router.prefetch(`/intake/${sessionId}/q/${questionNumber + 1}`);
  }
}, [questionNumber, totalQuestions, sessionId, router]);
```

---

### 10.3 Accessibility Implementation

**1. Semantic HTML:**
```tsx
<nav aria-label="Question navigation">
  <Button onClick={handleBack} aria-label="Go to previous question">
    <ArrowLeft aria-hidden="true" />
    Back
  </Button>
</nav>
```

**2. Keyboard Navigation:**
```tsx
function QuestionList({ questions, onSelect }: Props) {
  return (
    <ul role="list">
      {questions.map((q, i) => (
        <li key={q.id}>
          <button
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(i);
              }
            }}
          >
            {q.questionText}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

**3. ARIA Labels:**
```tsx
<Progress
  value={progress}
  aria-label={`Question ${current} of ${total}`}
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

---

### 10.4 Error Handling Patterns

**1. API Error Handling:**
```typescript
async function saveAnswer() {
  try {
    const response = await fetch('/api/...', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to save');
    }

    // Success
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }
}
```

**2. Error Boundaries:**
```typescript
// app/error.tsx (Next.js error boundary)
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. File Storage & Environment Configuration

### 11.1 Supabase Storage Integration

**Storage Backend:** Supabase Storage (100 GB included with Pro plan)

**Frontend Approach:**
- **All file operations go through backend API** - No direct client-to-Supabase interaction
- Frontend uploads files via multipart/form-data to backend
- Backend handles Supabase Storage bucket operations
- File downloads/display use signed URLs from backend

**Why This Approach:**
1. **Security:** Storage credentials never exposed to client
2. **Validation:** Backend controls file size/type limits
3. **Consistency:** All storage logic centralized
4. **Simplicity:** Frontend doesn't need Supabase client for storage

---

### 11.2 Environment Variables

**Frontend Environment Variables:**

```bash
# Required for API calls (Next.js API routes communicate with Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# NOT needed on frontend (backend-only):
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_STORAGE_BUCKET_NAME
```

**Important Notes:**
- `NEXT_PUBLIC_SUPABASE_URL` is only used for API endpoint configuration
- Storage bucket name is backend configuration only
- No storage-specific environment variables needed on frontend

---

### 11.3 File Upload Implementation

**Component: FileUpload.tsx**

```typescript
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId);
  formData.append('questionId', questionId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData, // multipart/form-data
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const { fileMetadata } = await response.json();

  return fileMetadata; // { fileName, fileSize, mimeType, fileUrl }
}
```

**No presigned URLs needed** - Backend handles everything.

---

### 11.4 File Display & Download

**Files are accessed via signed URLs from backend:**

```typescript
// Backend API returns file metadata with signed URLs
interface FileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string; // Signed URL from Supabase Storage (valid for limited time)
}

// Frontend displays files using signed URLs
function FileDisplay({ file }: { file: FileMetadata }) {
  return (
    <a
      href={file.fileUrl}
      download={file.fileName}
      className="flex items-center gap-2"
    >
      <FileIcon className="w-4 h-4" />
      {file.fileName}
    </a>
  );
}
```

**Signed URL Refresh:**
- Backend generates signed URLs when fetching responses
- URLs are valid for a configurable duration (e.g., 1 hour)
- If URL expires, frontend re-fetches response data from backend

---

### 11.5 File Upload Validation

**Client-Side Pre-Validation** (before upload):
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // ... etc
];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 50MB';
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type not supported';
  }

  return null; // Valid
}
```

**Backend Validation** (authoritative):
- Backend re-validates all constraints
- Rejects invalid uploads
- Returns clear error messages to frontend

---

## 12. Summary & Next Steps

### 12.1 Critical Path

**Must Complete (MVP):**
1. Admin login & dashboard
2. Questionnaire editor (with CSV upload)
3. Question display (one-at-a-time)
4. Voice input (EN + ES)
5. Text input fallback
6. File upload
7. Review & submit
8. Response viewer
9. CSV + Markdown export

**Nice to Have (Post-MVP):**
- Offline sync (can launch without, add later)
- Advanced drag-drop (can use simple up/down buttons)
- Real-time collaboration (not needed)

---

### 12.2 Success Criteria

**Before Launch:**
- [ ] All critical path features working
- [ ] Tested on iOS Safari and Chrome Mobile
- [ ] Voice input works in English and Spanish
- [ ] Page load <2 seconds on 4G
- [ ] Zero TypeScript errors
- [ ] Lighthouse score >90
- [ ] No critical accessibility violations

---

### 12.3 Handoff to Implementation

**Ready to Start When:**
1. Backend API routes are implemented
2. Database schema is deployed
3. Supabase Storage is configured (bucket created)
4. Environment variables are set

**First Sprint (Week 1):**
- Complete Phases 1-3 (Setup, Auth, Dashboard)
- Get feedback on admin UI
- Iterate if needed

**Questions for Architect:**
1. Is NextAuth.js credentials provider acceptable for MVP?
2. Do we need rate limiting on client routes?
3. Should we implement request deduplication?

---

*End of Frontend Implementation Plan*
