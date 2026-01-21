# Agricultural Consulting Intake Form — Product Design Document

**Version:** 1.0
**Date:** January 2026
**Project:** Mobile-First Voice-Enabled Intake Form Web App

---

## 1. Product Overview & Goals

### 1.1 Problem Statement

Agricultural consulting firms currently rely on Google Sheets-based intake forms to collect information from agtech vendor clients, creating significant friction at a critical first touchpoint. These clients—typically founders, C-level executives (CEO, CTO, COO), and high-ranking collaborators at agtech companies serving the agricultural space—spend 60+ minutes filling out comprehensive questionnaires covering business strategy, product, market, sales, operations, and other domains. This lengthy, tedious process:

- Creates a poor first impression with new clients
- Results in lower completion rates
- Produces rushed, low-quality responses due to fatigue
- Fails to capture nuanced context that consultants need
- Doesn't accommodate busy executives working between meetings, calls, or while traveling

**Root cause:** Traditional form design (all questions visible, typing-only input, desktop-oriented) is fundamentally mismatched to the use case.

### 1.2 Solution Vision

A mobile-first web app that transforms intake from a tedious administrative task into a conversational, low-friction experience by:

- **Voice-first interaction:** Clients speak responses naturally (English/Spanish), reducing cognitive load and time
- **Progressive disclosure:** One question at a time, maintaining focus and reducing overwhelm
- **Flexible access:** URL-based, no login required for clients
- **Auto-save:** Progress is never lost, reducing completion anxiety
- **Customizable per engagement:** Admins tailor questionnaires to specific client contexts

**Target outcome:** Reduce completion time from 60+ minutes to 15-30 minutes while increasing response quality and completion rates.

### 1.3 Target Users

**Primary:** Agricultural consulting firm owners/staff (admin users)
**Secondary:** Agtech vendor executives (founders, C-level, senior collaborators) filling out intake forms (end users)

### 1.4 Success Criteria

| Metric | Current State | Target (3 months post-launch) |
|--------|---------------|-------------------------------|
| Average completion time | 60+ minutes | 15-30 minutes |
| Completion rate | ~70% (estimated) | 90%+ |
| Response quality | Variable, often terse | Richer, more contextual |
| Time to deploy new form | Manual Google Sheets setup | <5 minutes |
| Mobile completion rate | ~20% (estimated) | 60%+ |

---

## 2. User Personas

### 2.1 Admin Persona: "Carmen the Consultant"

**Demographics:**
- Role: Agricultural business consultant, firm owner
- Age: 35-55
- Tech comfort: Moderate (uses Google Suite, Zoom, CRM)
- Work context: Desk-based with frequent client calls

**Goals:**
- Quickly customize intake forms for new client engagements
- Collect comprehensive, high-quality information before first consultation
- Minimize back-and-forth clarification emails
- Present a professional, modern first impression
- Efficiently review and analyze client responses

**Pain Points:**
- Current Google Sheets forms are time-consuming to duplicate and customize
- Clients abandon or submit incomplete forms
- Responses lack depth needed for meaningful consultation prep
- No insight into whether client has started/completed the form
- Difficult to parse spreadsheet responses quickly

**Behavioral Patterns:**
- Creates new intake forms 2-5 times per month
- Typically works from template, modifying 40-60% of questions
- Reviews responses within 24 hours of submission
- Values efficiency and clarity over complex features

### 2.2 Client Persona: "Sofia the Agtech Founder"

**Demographics:**
- Role: Co-founder & CEO at early-stage agtech company (precision agriculture SaaS platform)
- Age: 32-45
- Tech comfort: High (tech industry background, mobile-native)
- Work context: Constantly between investor meetings, customer calls, team management—rarely at desk for extended periods
- Language: Bilingual (English/Spanish), comfortable in both

**Goals:**
- Complete intake quickly without sacrificing quality (time is extremely valuable)
- Provide thorough, strategic information to maximize ROI from consulting engagement
- Fit form completion into fragmented schedule (between meetings, during travel)
- Avoid typing long responses on mobile while multitasking

**Pain Points:**
- Lengthy forms feel overwhelming and time-consuming when juggling 100 priorities
- Typing detailed responses on mobile is frustrating, especially strategic/qualitative answers
- Unsure how much detail to provide—wants to be thorough but efficient
- Difficult to set aside uninterrupted time for administrative tasks
- Often starts forms with good intentions but abandons when called into next meeting

**Behavioral Patterns:**
- Checks email/completes tasks primarily on mobile during commutes, between meetings, or while traveling
- More comfortable speaking than writing for long-form responses (can articulate strategy verbally faster)
- Prefers to complete tasks in one session if possible (completion-oriented mindset)
- Loses motivation if progress isn't visible or saved (high opportunity cost of time)
- Values efficiency highly—needs to see immediate purpose and ROI in requests

---

## 3. User Journeys

### 3.1 Admin Journey: Create & Deploy Intake Form

**Goal:** Set up a customized intake form for a new client engagement and share it.

#### Flow Diagram

```
[Admin logs in]
    ↓
[Dashboard: View all questionnaires]
    ↓
[Click "Create New Questionnaire"]
    ↓
    ├─→ [Option A: Upload CSV template]
    └─→ [Option B: Create from scratch]
    ↓
[Edit questionnaire: Add/remove/reorder questions]
    ↓
[Set required/optional flags per question]
    ↓
[Preview client experience]
    ↓
[Save questionnaire]
    ↓
[Get shareable URL]
    ↓
[Send URL to client via email or copy/paste]
    ↓
[Monitor completion status] ──→ [Receive notification when submitted]
    ↓
[Review responses in dashboard or export]
```

#### Detailed Steps

| Step | User Action | System Response | Notes |
|------|-------------|-----------------|-------|
| 1 | Admin visits app URL | Presents login screen | Simple password-protected access |
| 2 | Enters password | Loads dashboard showing all questionnaires (list view) | Shows: title, client name, status, date created |
| 3 | Clicks "Create New" | Presents two options: "Upload CSV" or "Start from Scratch" | CSV format provided in help tooltip |
| 4a | Uploads CSV | Parses CSV, displays questions in editor | Validation errors shown if CSV malformed |
| 4b | Starts from scratch | Opens empty question editor | |
| 5 | Adds/edits questions | Question appears in editable list | Inline editing, drag-to-reorder |
| 6 | Sets question type | Dropdown: "Open-ended", "Short answer", "File upload" | Affects client UI presentation |
| 7 | Toggles required/optional | Checkbox updates per question | Default: required |
| 8 | Clicks "Preview" | Opens preview in mobile viewport | Shows exactly what client will see |
| 9 | Saves questionnaire | Generates unique URL | Auto-saves occur every 30 seconds |
| 10 | Copies URL or sends email | System provides copy button and optional email sender | Email includes URL and brief instructions |
| 11 | Monitors status | Dashboard shows "Not Started", "In Progress", "Completed" | Real-time status updates |
| 12 | Client submits | Admin receives email notification | Includes link to view responses |
| 13 | Reviews responses | Views formatted responses in app or exports CSV/Markdown | |

#### Edge Cases & Error States

| Scenario | System Behavior | User Guidance |
|----------|-----------------|---------------|
| CSV upload fails | Show specific error (e.g., "Missing 'question_text' column") | Provide link to CSV template download |
| No questions added | Disable "Save" button | Display message: "Add at least one question" |
| Network interruption during edit | Auto-save recovers on reconnection | Show "Saving..." indicator with success/failure state |
| Admin tries to delete questionnaire with responses | Confirmation modal: "This has responses. Archive instead?" | Prevent accidental data loss |
| Client hasn't started after 48 hours | Optional: Send reminder email | Admin can enable/disable reminders |

---

### 3.2 Client Journey: Complete Intake Form

**Goal:** Complete intake questionnaire efficiently with minimal friction, providing high-quality information.

#### Flow Diagram

```
[Client receives URL via email]
    ↓
[Clicks URL → Opens in mobile browser]
    ↓
[Welcome screen: Context + estimated time]
    ↓
[Question 1 of N displayed]
    ↓
    ├─→ [Tap microphone icon → Voice dictation]
    │       ↓
    │   [Real-time transcription appears]
    │       ↓
    │   [Tap to edit transcription if needed]
    │
    └─→ [Type response manually]
    ↓
[Tap "Next" → Auto-saves → Question 2 of N]
    ↓
[Progress bar updates]
    ↓
[Repeats for all questions]
    ↓
[Final question: File upload / shared folder URL]
    ↓
[Review summary (optional)]
    ↓
[Submit]
    ↓
[Confirmation screen: "Thank you" + next steps]
```

#### Detailed Steps

| Step | User Action | System Response | Notes |
|------|-------------|-----------------|-------|
| 1 | Client clicks URL in email | Loads welcome screen | No login required |
| 2 | Reads welcome screen | Shows: consultant name, purpose, estimated time (15-30 min), "Start" button | Sets expectations |
| 3 | Taps "Start" | Displays Question 1 with progress indicator (1 of N) | Only one question visible |
| 4 | Taps microphone icon | Requests mic permission (first time only), begins recording | Visual feedback: pulsing red indicator |
| 5 | Speaks response (English or Spanish) | Real-time transcription appears below question | Supports both languages |
| 6 | Taps mic icon again | Stops recording, finalizes transcription | Client can review text |
| 7 | (Optional) Edits transcription | Text field becomes editable | Allows corrections without re-recording |
| 8 | Taps "Next" | Saves response, advances to Question 2 | Auto-save with visual confirmation |
| 9 | Sees progress bar update | Progress bar shows 2 of N completed | Motivational feedback |
| 10 | Repeats steps 4-9 | Continues through all questions | Can also type instead of speaking |
| 11 | Reaches file upload question | Option to upload files OR paste shared folder URL | Supports Dropbox, Google Drive links |
| 12 | (Optional) Taps "Review Answers" | Shows scrollable summary of all responses | Can navigate back to edit |
| 13 | Taps "Submit" | Confirmation modal: "Ready to submit?" | Final checkpoint |
| 14 | Confirms submission | Displays success screen with next steps | Email confirmation sent |

#### Edge Cases & Error States

| Scenario | System Behavior | User Guidance |
|----------|-----------------|---------------|
| Mic permission denied | Show fallback: "Type your response" with text input | Explain how to enable mic in settings |
| Voice transcription fails | Auto-fallback to text input | "Having trouble hearing. Try typing instead." |
| Network lost mid-session | Queue responses locally, sync when reconnected | "Your answers are saved on this device" |
| Client closes browser | Progress saved via URL + device storage | Next visit resumes where they left off |
| Required question skipped | "Next" button disabled | Show message: "This question is required" |
| Client goes back to edit | Can navigate to any previous question | Changes auto-save |
| Session idle >30 minutes | Auto-save persists, no timeout | Client can resume anytime |
| File upload fails | Retry button + option to paste shared link instead | "Having trouble uploading. Try a shared link." |
| Client submits without file | Warning if file question is required | "No file uploaded. Continue anyway?" |

---

## 4. Feature Specifications

### 4.1 Admin Features

#### 4.1.1 Authentication & Access Control

**User Story:**
As an admin, I want simple password-protected access so that only my team can create and manage questionnaires without complex account setup.

**Acceptance Criteria:**
- [ ] Admin can access app via URL (e.g., `app.domain.com/admin`)
- [ ] Login screen requests single shared password
- [ ] Incorrect password shows error: "Invalid password. Try again."
- [ ] Successful login creates session (persists 7 days or until logout)
- [ ] No user accounts, registration, or password reset flow in MVP
- [ ] Session expires after 7 days of inactivity
- [ ] "Logout" button clears session and returns to login

**Priority:** P0 (MVP critical)

**Notes for Implementation:**
- Single shared password stored securely (admin configures during deployment)
- Session management via secure cookies
- No personally identifiable admin data stored

---

#### 4.1.2 Dashboard: Questionnaire Management

**User Story:**
As an admin, I want to view all my questionnaires in one place with clear status indicators so I can track which clients have completed intake.

**Acceptance Criteria:**
- [ ] Dashboard displays all questionnaires in reverse chronological order (newest first)
- [ ] Each questionnaire card shows:
  - [ ] Questionnaire title (editable)
  - [ ] Client name (editable)
  - [ ] Status badge: "Not Started" (gray), "In Progress" (yellow), "Completed" (green)
  - [ ] Date created
  - [ ] "View/Edit" and "Copy URL" buttons
  - [ ] "Archive" option (hidden in overflow menu)
- [ ] "Create New Questionnaire" button prominent at top
- [ ] Empty state (no questionnaires) shows: "Get started by creating your first questionnaire"
- [ ] Search/filter (future): Not in MVP

**Priority:** P0 (MVP critical)

**States:**
- **Empty state:** No questionnaires created yet
- **Default state:** List of questionnaires with mixed statuses
- **Loading state:** Skeleton loaders while fetching data
- **Error state:** "Unable to load questionnaires. Refresh to try again."

---

#### 4.1.3 Create/Upload Questionnaire

**User Story:**
As an admin, I want to quickly create a new questionnaire by uploading a CSV template or building from scratch so I can deploy customized intake forms efficiently.

**Acceptance Criteria:**
- [ ] "Create New" opens modal with two options:
  - [ ] "Upload CSV" (with file picker)
  - [ ] "Start from Scratch" (opens blank editor)
- [ ] CSV upload:
  - [ ] Accepts `.csv` files only
  - [ ] Expected columns: `question_text`, `question_type` (open_ended, short_answer, file_upload), `required` (true/false)
  - [ ] Validates CSV format, shows specific errors if malformed
  - [ ] Example: "Row 5: Missing 'question_text' column"
  - [ ] Successful upload loads questions into editor
- [ ] "Start from Scratch" opens empty question editor with "Add Question" button
- [ ] Provide downloadable CSV template with example questions

**Priority:** P0 (MVP critical)

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| CSV >100 questions | Warning: "Large questionnaire may impact completion rate. Consider splitting." |
| Duplicate question text | Allow, but flag in editor: "Possible duplicate" |
| Invalid `question_type` value | Default to "open_ended", show warning |
| Missing `required` column | Default all questions to required |

---

#### 4.1.4 Question Editor

**User Story:**
As an admin, I want to add, edit, reorder, and configure questions so I can tailor the questionnaire to each client's context.

**Acceptance Criteria:**
- [ ] Question editor displays all questions in a vertical list
- [ ] Each question row shows:
  - [ ] Drag handle (for reordering)
  - [ ] Question text (inline editable)
  - [ ] Question type dropdown: "Open-ended", "Short answer", "File upload"
  - [ ] "Required" toggle (default: ON)
  - [ ] Delete icon (with confirmation)
- [ ] "Add Question" button at bottom adds new blank question
- [ ] Drag-and-drop reordering updates question sequence immediately
- [ ] Changes auto-save every 30 seconds
- [ ] Manual "Save" button triggers immediate save
- [ ] "Preview" button opens mobile preview in modal
- [ ] Character limit for question text: 500 characters
- [ ] Minimum 1 question required to save

**Priority:** P0 (MVP critical)

**Question Type Definitions:**
- **Open-ended:** Long-form response (e.g., "Describe your go-to-market strategy")
  - Client UI: Large text area, voice dictation recommended
- **Short answer:** Brief response (e.g., "Number of employees?")
  - Client UI: Single-line text input, voice dictation available
- **File upload:** File attachment or shared folder URL
  - Client UI: File picker + text input for URL

**States:**
- **Empty state:** "No questions added. Click 'Add Question' to start."
- **Editing state:** Question row expands, shows inline editor
- **Saving state:** "Saving..." indicator with success/failure feedback
- **Error state:** "Failed to save. Check connection and try again."

---

#### 4.1.5 Share Questionnaire

**User Story:**
As an admin, I want to easily share the questionnaire URL with clients via email or direct link so they can access it immediately.

**Acceptance Criteria:**
- [ ] After saving questionnaire, system generates unique URL (e.g., `app.domain.com/intake/abc123xyz`)
- [ ] "Copy URL" button copies link to clipboard with success toast
- [ ] Optional "Send via Email" button opens pre-filled email:
  - [ ] To: (admin enters client email)
  - [ ] Subject: "Intake Questionnaire from [Consultant Name]"
  - [ ] Body: Brief intro + URL + estimated time + contact info
  - [ ] Email template editable in admin settings (future)
- [ ] URL is permanent and doesn't expire (until archived)
- [ ] No password or authentication required for client to access

**Priority:** P0 (MVP critical)

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| URL copied successfully | Toast: "Link copied to clipboard" |
| Clipboard permission denied | Show URL in text box: "Copy this link manually" |
| Email send fails | Error message, fallback to manual copy |

---

#### 4.1.6 View Responses

**User Story:**
As an admin, I want to review client responses in a clear, formatted view and export them in multiple formats so I can prepare for consultations efficiently and feed data into downstream workflows.

**Acceptance Criteria:**
- [ ] "View Responses" button on completed questionnaires opens response viewer
- [ ] Response viewer displays:
  - [ ] Client name and completion date at top
  - [ ] Each question with its response below (accordion style, all expanded by default)
  - [ ] File uploads shown as downloadable links
  - [ ] Shared folder URLs shown as clickable links
- [ ] "Export" options (dropdown button with two formats):
  - [ ] **CSV export:** Two-column format (Question | Response)
    - [ ] File name: `{client_name}_intake_{date}.csv`
  - [ ] **Markdown transcript export:** Interview-style Q&A format (P0 - MVP critical)
    - [ ] Format: `Q: {question_text}\nA: {response_text}\n\n` (repeating for all questions)
    - [ ] File name: `{client_name}_intake_transcript_{date}.md`
    - [ ] File uploads represented as `[File: filename.pdf]` or `[Shared Folder: URL]`
    - [ ] Clean, readable formatting for feeding into AI analysis or other workflows
- [ ] Email notification sent to admin when client submits (contains link to view responses)

**Priority:** P0 (MVP critical)

**Markdown Export Format Example:**
```markdown
# Client Intake Transcript
**Client:** Acme AgTech Inc.
**Completed:** January 20, 2026

---

Q: Describe your agricultural business, including primary products, scale of operations, and years in business.

A: We're a precision agriculture SaaS platform that helps large-scale farms optimize irrigation and fertilizer usage through AI-driven recommendations. We've been operating for 3 years and currently serve 150 farms across California and Arizona, covering approximately 50,000 acres.

---

Q: What is your current annual revenue? (Approximate is fine)

A: $2.5 million ARR as of last quarter.

---

Q: Upload financial documents or provide shared folder link.

A: [Shared Folder: https://drive.google.com/drive/folders/abc123xyz]

---
```

**States:**
- **Loading state:** Skeleton loaders while fetching responses
- **Error state:** "Unable to load responses. Refresh to try again."
- **Export in progress:** Loading spinner on export button, disabled during generation
- **Export success:** Toast notification: "Transcript downloaded" or "CSV downloaded"
- **Export failure:** Error message: "Export failed. Try again."

---

### 4.2 Client Features

#### 4.2.1 URL Access (No Login)

**User Story:**
As a client, I want to access the intake form immediately via URL without creating an account so I can start quickly.

**Acceptance Criteria:**
- [ ] Client clicks unique URL → immediately loads welcome screen
- [ ] No login, registration, or authentication required
- [ ] URL format: `app.domain.com/intake/{unique-id}`
- [ ] Invalid/expired URLs show error: "This questionnaire is no longer available. Contact [consultant name]."
- [ ] URL works on all modern mobile browsers (iOS Safari, Chrome, Firefox)
- [ ] No cookies required for basic functionality

**Priority:** P0 (MVP critical)

---

#### 4.2.2 Welcome Screen

**User Story:**
As a client, I want to understand what's expected before starting so I can set aside appropriate time and context.

**Acceptance Criteria:**
- [ ] Welcome screen displays:
  - [ ] Consultant/firm name and logo (optional)
  - [ ] Headline: "Welcome! Let's get started."
  - [ ] Brief purpose statement (editable by admin, default provided)
  - [ ] Estimated completion time: "15-30 minutes"
  - [ ] Instructions: "Answer each question by speaking or typing. Your progress is saved automatically."
  - [ ] Large "Start" button
- [ ] Mobile-optimized layout (vertical, single column)
- [ ] No action required except tapping "Start"

**Priority:** P0 (MVP critical)

---

#### 4.2.3 Voice Dictation (Primary Input)

**User Story:**
As a client, I want to speak my responses naturally in English or Spanish so I can complete the form faster and more comfortably than typing.

**Acceptance Criteria:**
- [ ] Each question displays prominent microphone icon/button
- [ ] Tapping mic button:
  - [ ] Requests microphone permission (first time only)
  - [ ] Begins recording (visual indicator: pulsing red circle)
  - [ ] Shows "Listening..." text
- [ ] Speech-to-text transcription appears in real-time below question
- [ ] Supports English and Spanish language detection (auto-detect or manual toggle)
- [ ] Tapping mic button again stops recording and finalizes transcription
- [ ] Transcription remains editable as text after recording stops
- [ ] "Re-record" button allows client to discard and start over
- [ ] If mic permission denied, fallback to text input with message: "Type your response"

**Priority:** P0 (MVP critical)

**Technical Notes for Architect:**
- Use Web Speech API (browser-native) for MVP
- Fallback to text input if unsupported browser
- Support language codes: `en-US`, `es-ES`, `es-MX`

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| Mic permission denied | Show text input with guidance: "Enable microphone for voice input" |
| Background noise interferes | Client can edit transcription or re-record |
| Transcription confidence low | (Future) Flag for manual review, but accept for MVP |
| Very long response (>1000 words) | Allow, but warn: "Long response detected. Consider summarizing." (future) |

---

#### 4.2.4 Text Input (Fallback)

**User Story:**
As a client, I want the option to type responses if I prefer or if voice isn't working so I'm never blocked from completing the form.

**Acceptance Criteria:**
- [ ] Text input field always visible below/beside microphone button
- [ ] For "open-ended" questions: Expandable textarea, 500 character limit (soft)
- [ ] For "short answer" questions: Single-line input, 100 character limit (soft)
- [ ] Client can switch between voice and text freely
- [ ] If client types, voice transcription is replaced
- [ ] If client speaks after typing, confirm: "Replace typed text?"

**Priority:** P0 (MVP critical)

---

#### 4.2.5 Question-by-Question Navigation

**User Story:**
As a client, I want to see one question at a time with clear progress indicators so I stay focused and don't feel overwhelmed.

**Acceptance Criteria:**
- [ ] Only one question visible at a time
- [ ] Progress bar at top shows: "Question 3 of 15" (text + visual bar)
- [ ] "Next" button advances to next question (disabled until current question answered if required)
- [ ] "Back" button returns to previous question (allows editing)
- [ ] Question transitions smoothly (no jarring page reloads)
- [ ] Progress bar updates immediately after "Next"
- [ ] Answers auto-save on "Next" with brief success indicator ("Saved ✓")

**Priority:** P0 (MVP critical)

**States:**
- **Question display:** Current question with input options
- **Required question unanswered:** "Next" button disabled, tooltip: "This question is required"
- **Optional question unanswered:** "Next" button enabled, client can skip
- **Last question:** "Next" button replaced with "Review Answers" or "Submit"

---

#### 4.2.6 Auto-Save & Progress Persistence

**User Story:**
As a client, I want my progress saved automatically so I never lose work if I close the browser or lose connection.

**Acceptance Criteria:**
- [ ] Each answer auto-saves when client taps "Next"
- [ ] Progress saved to server (tied to unique URL session)
- [ ] If client closes browser and returns later via same URL, progress is restored
- [ ] Visual confirmation after each save: "Saved ✓" (appears briefly)
- [ ] If network unavailable, answers queue locally and sync when reconnected
- [ ] Offline indicator: "Offline. Your answers will sync when reconnected."

**Priority:** P0 (MVP critical)

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| Network disconnects mid-answer | Queue locally, sync when back online |
| Client returns after days | Progress still saved, can resume |
| Client opens URL on different device | Progress is URL-specific, not device-specific (separate sessions) |
| Multiple tabs open with same URL | Changes in one tab may not reflect in other (acceptable for MVP) |

---

#### 4.2.7 File Upload / Shared Folder URL

**User Story:**
As a client, I want to easily attach supporting documents or share a folder link as the final step so the consultant has all necessary materials.

**Acceptance Criteria:**
- [ ] Final question (or designated question) prompts: "Upload files or provide a shared folder link"
- [ ] Two input options:
  - [ ] File picker button: "Choose Files" (allows multiple files)
  - [ ] Text input: "Or paste shared folder URL (Dropbox, Google Drive, etc.)"
- [ ] File uploads show progress bar and file name(s)
- [ ] Accepted file types: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (configurable by admin in future)
- [ ] File size limit: 50MB per file (configurable)
- [ ] Shared folder URLs validated (checks for http/https)
- [ ] Client can provide both files and URL if desired
- [ ] This question can be marked optional by admin

**Priority:** P0 (MVP critical)

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| File exceeds size limit | Error: "File too large. Max 50MB per file." |
| Invalid URL format | Warning: "This doesn't look like a valid URL. Double-check." |
| Upload fails | Retry button + option to paste shared link instead |
| No file/URL provided (if optional) | Allow submission |
| No file/URL provided (if required) | Block submission: "Please upload files or provide a link" |

---

#### 4.2.8 Review & Submit

**User Story:**
As a client, I want to review all my answers before submitting so I can ensure accuracy and completeness.

**Acceptance Criteria:**
- [ ] After last question, client sees "Review Answers" button
- [ ] Review screen displays:
  - [ ] All questions and responses in scrollable list
  - [ ] "Edit" button next to each question (navigates back to that question)
  - [ ] "Submit" button at bottom (prominent, green)
- [ ] Tapping "Edit" allows client to change answer and return to review
- [ ] Tapping "Submit" triggers confirmation modal: "Ready to submit? You won't be able to make changes after submission."
- [ ] Confirmation options: "Go Back" or "Submit"
- [ ] After submission, display success screen with:
  - [ ] "Thank you!" message
  - [ ] "Your responses have been submitted to [Consultant Name]"
  - [ ] Next steps or contact information (configurable by admin)
  - [ ] Optional: "Download a copy of your responses" (future)

**Priority:** P0 (MVP critical)

**States:**
- **Review screen loading:** Skeleton loaders
- **Submission in progress:** Loading spinner over "Submit" button, disable button
- **Submission success:** Success screen
- **Submission failure:** Error message: "Submission failed. Check connection and try again." Keep answers saved, allow retry.

---

## 5. UX Principles & Approach

### 5.1 Mobile-First Design

**Philosophy:** The majority of use cases will occur on mobile devices (in field, between meetings, during commutes). Desktop is secondary.

**Implications:**
- Single-column layouts
- Large, thumb-friendly tap targets (minimum 44x44px)
- Minimize scrolling per screen
- Optimize for portrait orientation
- Test on iOS Safari and Chrome (primary browsers)
- Fast load times (<3s on 3G)

**Specific Patterns:**
- Floating "Next" button at bottom (always accessible)
- Fixed progress bar at top (persistent context)
- Avoid horizontal scrolling
- Minimize input field zoom on iOS (font-size ≥16px)

---

### 5.2 Voice-First Interaction

**Philosophy:** Voice is the PRIMARY input method. Text is the fallback, not the other way around.

**Implications:**
- Microphone button must be visually prominent (larger than text input)
- Clear affordances: "Tap to speak" as default state
- Real-time transcription builds trust
- Support for errors and retries without friction
- Language flexibility (English/Spanish auto-detect)

**Specific Patterns:**

#### For Open-Ended Questions:
```
┌─────────────────────────────────┐
│ Question 5 of 15               │ ← Progress
├─────────────────────────────────┤
│                                 │
│ Describe your go-to-market      │
│ strategy and key distribution   │
│ channels.                       │
│                                 │
│  ┌─────────────────────┐        │
│  │   🎤  Tap to speak  │        │ ← PRIMARY CTA
│  │                     │        │
│  └─────────────────────┘        │
│                                 │
│  Or type your response:         │ ← Secondary option
│  ┌─────────────────────┐        │
│  │                     │        │
│  │                     │        │
│  └─────────────────────┘        │
│                                 │
│           [Next →]              │
└─────────────────────────────────┘
```

#### During Voice Recording:
```
┌─────────────────────────────────┐
│ Question 5 of 15               │
├─────────────────────────────────┤
│                                 │
│ Describe your go-to-market      │
│ strategy...                     │
│                                 │
│  ┌─────────────────────┐        │
│  │    ● Listening...   │        │ ← Pulsing red indicator
│  │   (Tap to stop)     │        │
│  └─────────────────────┘        │
│                                 │
│  "We primarily sell through     │ ← Real-time transcription
│  agricultural co-ops and        │
│  direct to large farms..."      │
│                                 │
└─────────────────────────────────┘
```

#### After Voice Recording:
```
┌─────────────────────────────────┐
│ Question 5 of 15               │
├─────────────────────────────────┤
│                                 │
│ Describe your go-to-market      │
│ strategy...                     │
│                                 │
│  ┌─────────────────────┐        │
│  │   🎤 Re-record      │        │ ← Option to retry
│  └─────────────────────┘        │
│                                 │
│  Your response:                 │
│  ┌─────────────────────┐        │
│  │ "We primarily sell  │        │ ← Editable transcription
│  │ through agricultural│        │
│  │ co-ops and direct..."│       │
│  └─────────────────────┘        │
│                                 │
│           [Next →]              │
└─────────────────────────────────┘
```

**Voice UX Best Practices:**
- Always show what the system heard (no "black box" transcription)
- Allow immediate correction without re-recording entire response
- Provide confidence: "Your voice is working" via real-time feedback
- Degrade gracefully: If voice fails, text input appears with explanation

---

### 5.3 Progressive Disclosure

**Philosophy:** Reduce cognitive load by revealing information only when needed. Never show all questions at once.

**Implications:**
- One question per screen
- Progress indicators replace anxiety about "how much is left"
- Linear flow (no complex branching in MVP)
- Client can always navigate back, but default is forward progression

**Benefits:**
- Focus: Client thinks about one thing at a time
- Momentum: Completing each question feels like progress
- Completion: Lower abandonment because next step is always clear

---

### 5.4 Accessibility Considerations

**MVP Accessibility Standards:**
- WCAG 2.1 Level AA compliance as target
- Keyboard navigation support (for desktop users)
- Screen reader compatibility (ARIA labels on interactive elements)
- Sufficient color contrast (4.5:1 for text)
- Text resizing support (up to 200% without breaking layout)
- Alternative text for icons (especially microphone button)

**Future Enhancements (Post-MVP):**
- High-contrast mode
- Text-to-speech for questions (read aloud)
- Adjustable font sizes
- Haptic feedback for mobile interactions

---

### 5.5 Performance & Load Times

**Philosophy:** Speed is a feature. Slow load times increase friction and abandonment.

**Targets:**
- Initial page load: <2 seconds on 4G
- Question transitions: <200ms
- Voice transcription latency: <1 second
- Auto-save confirmation: <500ms

**Strategies:**
- Minimal JavaScript bundle size
- Lazy-load non-critical assets
- Optimize images (consultant logo)
- Use CDN for static assets
- Progressive enhancement (core functionality works without JS, voice requires JS)

---

## 6. Information Architecture

### 6.1 Site Map

```
┌─────────────────────────────────────────┐
│             Application                 │
└─────────────────────────────────────────┘
        │
        ├─→ [Admin Portal] (Password-protected)
        │      │
        │      ├─→ /admin/login
        │      │
        │      ├─→ /admin/dashboard (List all questionnaires)
        │      │      │
        │      │      └─→ /admin/questionnaire/{id}/edit (Create/Edit)
        │      │              │
        │      │              ├─→ Upload CSV
        │      │              ├─→ Edit questions
        │      │              ├─→ Preview
        │      │              └─→ Get shareable URL
        │      │
        │      └─→ /admin/questionnaire/{id}/responses (View responses)
        │             │
        │             └─→ Export (CSV)
        │
        └─→ [Client Portal] (Public, URL-based access)
               │
               ├─→ /intake/{unique-id} (Welcome screen)
               │      │
               │      └─→ /intake/{unique-id}/q/{question-number}
               │             │
               │             ├─→ Voice dictation interface
               │             ├─→ Text input interface
               │             └─→ Auto-save
               │
               ├─→ /intake/{unique-id}/review (Review answers)
               │
               └─→ /intake/{unique-id}/complete (Success screen)
```

---

### 6.2 Data Model (Conceptual)

**Questionnaire**
- `id` (unique identifier)
- `title` (e.g., "Client Intake - Acme AgTech")
- `client_name`
- `status` (not_started, in_progress, completed)
- `created_date`
- `completed_date` (nullable)
- `unique_url` (e.g., `/intake/abc123xyz`)
- `questions[]` (array of Question objects)

**Question**
- `id` (unique within questionnaire)
- `question_text` (max 500 characters)
- `question_type` (open_ended, short_answer, file_upload)
- `required` (boolean)
- `order` (integer, for sequencing)

**Response** (tied to questionnaire + client session)
- `questionnaire_id`
- `question_id`
- `answer_text` (for open-ended and short-answer)
- `answer_files[]` (for file uploads, array of file URLs)
- `answer_url` (for shared folder URL)
- `language` (en or es, detected from voice input)
- `input_method` (voice or text)
- `timestamp` (when answered)

**Session** (tracks client progress)
- `questionnaire_id`
- `current_question_id` (for resume functionality)
- `last_activity` (timestamp)
- `completed` (boolean)

---

### 6.3 Navigation Patterns

#### Admin Navigation:
- **Persistent header:** Logo, "Dashboard" link, "Logout" button
- **Dashboard:** List of questionnaires, "Create New" button
- **Breadcrumbs:** Dashboard > Edit Questionnaire > Preview

#### Client Navigation:
- **Minimal chrome:** Progress bar at top, no persistent header/footer
- **Linear flow:** Client moves forward (Next) or backward (Back) one question at a time
- **No traditional navigation menu:** Keeps focus on task at hand
- **Exit strategy:** (Future) "Save and exit" button, sends resume link via email

---

## 7. Scope & Prioritization

### 7.1 MVP (Phase 1) — Must-Have Features

**Goal:** Launch functional product that solves core problem: reduce intake time via voice input.

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Admin login (password-protected) | P0 | Security baseline |
| Create/edit questionnaires | P0 | Core admin workflow |
| Upload questionnaire via CSV | P0 | Speed for admin setup |
| Set required/optional per question | P0 | Flexibility for different clients |
| Generate shareable URL | P0 | Distribution mechanism |
| Client URL access (no login) | P0 | Reduce client friction |
| Question-by-question UI | P0 | Differentiator from Google Sheets |
| Voice dictation (English + Spanish) | P0 | Core value proposition |
| Text input fallback | P0 | Accessibility and voice failure handling |
| Auto-save progress | P0 | Prevents data loss, enables multi-session |
| File upload / shared folder URL | P0 | Complete intake data collection |
| Review & submit | P0 | Data validation checkpoint |
| View responses (admin) | P0 | Admin must access data |
| Export responses (CSV) | P0 | Integration with existing workflows |
| Export transcript (Markdown) | P0 | Primary consumption format for AI/analysis workflows |
| Mobile-responsive design | P0 | Primary use case |

**MVP Timeline Estimate:** 6-8 weeks (subject to technical validation)

---

### 7.2 Phase 2 — High-Value Enhancements

**Goal:** Improve efficiency and experience based on MVP usage data.

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Email notifications (admin when client submits) | P1 | Reduces manual checking |
| Email reminders (client if not started after 48h) | P1 | Increases completion rate |
| Questionnaire templates (common question sets) | P1 | Faster admin setup |
| Duplicate questionnaire | P1 | Admin efficiency |
| Conditional logic (skip questions based on answers) | P1 | Personalized experience |
| Response analytics (avg completion time, abandonment points) | P1 | Data-driven optimization |
| Multi-language UI (full Spanish support) | P1 | Expands addressable market |
| Offline mode (full functionality) | P1 | Field reliability |

---

### 7.3 Phase 3 — Advanced Features (Future)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Multi-user admin (team access with roles) | P2 | Scalability for larger firms |
| Client accounts (save across multiple questionnaires) | P2 | Enterprise client convenience |
| Integrations (CRM, Google Drive, Dropbox API) | P2 | Workflow automation |
| AI-powered response insights (summarization, key themes) | P2 | Consultant efficiency |
| Video responses (for complex questions) | P2 | Richer data capture |
| Branding customization (white-label) | P2 | Agency/reseller model |
| PDF export of responses | P2 | Professional deliverable |
| Question branching (complex logic trees) | P2 | Advanced questionnaire design |

---

### 7.4 Explicitly Out of Scope (MVP)

**These will NOT be built in Phase 1:**
- Payment processing or subscription billing
- Advanced user roles/permissions
- Question logic/branching
- Multiple questionnaire versions or A/B testing
- Client login or account creation
- In-app messaging between admin and client
- Mobile native apps (iOS/Android)
- Integration with third-party tools (CRM, etc.)
- Custom branding beyond logo upload
- Multi-language UI (English only for admin)

---

## 8. Success Metrics

### 8.1 Primary Metrics (Measure Problem Solution)

| Metric | Measurement Method | Target (3 months post-launch) |
|--------|-------------------|-------------------------------|
| **Average completion time** | Track time from start to submit per questionnaire | 15-30 minutes (down from 60+) |
| **Completion rate** | % of clients who start and finish | 90%+ (up from ~70%) |
| **Voice input adoption** | % of questions answered via voice vs. text | 70%+ of responses use voice |
| **Mobile usage rate** | % of completions on mobile devices | 60%+ (up from ~20%) |

---

### 8.2 Secondary Metrics (User Experience Quality)

| Metric | Measurement Method | Target |
|--------|-------------------|--------|
| **Response quality** | Admin subjective rating (1-5 scale) after reviewing | Avg 4.0+ (vs. baseline 3.0) |
| **Admin setup time** | Time from login to shareable URL generation | <5 minutes |
| **Client satisfaction** | Post-submission survey: "How easy was this?" (1-5) | Avg 4.5+ |
| **Error rate** | % of sessions with voice transcription failures | <10% |
| **Return rate** | % of clients who exit and return to complete later | <20% (indicates need for multi-session) |

---

### 8.3 Business Impact Metrics

| Metric | Measurement Method | Target |
|--------|-------------------|--------|
| **Admin adoption rate** | % of consultants using app vs. Google Sheets | 100% within 6 months |
| **Client feedback quality** | Consultant reports on data usefulness | Qualitative improvement |
| **Time saved per questionnaire** | Admin reports on prep time reduction | 30+ minutes saved per client |

---

### 8.4 Technical Performance Metrics

| Metric | Measurement Method | Target |
|--------|-------------------|--------|
| **Page load time** | Avg time to interactive (mobile, 4G) | <2 seconds |
| **Voice transcription latency** | Time from speech end to text display | <1 second |
| **Auto-save reliability** | % of save operations that succeed | 99.9% |
| **Uptime** | % of time app is accessible | 99.5% |

---

### 8.5 Instrumentation Plan

**Data Collection Points:**
1. **Admin side:**
   - Questionnaire created (timestamp, CSV vs. scratch)
   - Questions added/edited/deleted (count, types)
   - URL shared (method: email vs. copy)
   - Responses viewed (timestamp)
   - Responses exported (format)

2. **Client side:**
   - Session started (device, browser, timestamp)
   - Question answered (question ID, input method: voice/text, language, duration)
   - Voice recording attempted (success/failure)
   - Navigation (next, back, edit)
   - Session paused (exit without completion)
   - Session resumed (return after exit)
   - Submission completed (total time, timestamp)

3. **System:**
   - Error logs (voice API failures, save failures, upload failures)
   - Performance metrics (load times, API response times)

**Tools:** (Technical implementation detail, but note: Google Analytics or similar for basic tracking, custom DB logging for granular question-level data)

---

## 9. Edge Cases & Error Handling Summary

### 9.1 Critical Edge Cases

| Category | Scenario | Handling Strategy |
|----------|----------|-------------------|
| **Voice input** | Mic permission denied | Fallback to text input with clear guidance |
| **Voice input** | Transcription fails (network/API error) | Auto-fallback to text, show error message |
| **Voice input** | Inaccurate transcription | Allow editing without re-recording |
| **Network** | Connection lost mid-session | Queue responses locally, sync on reconnect |
| **Network** | Submission fails | Retry button, preserve data locally |
| **Session** | Client closes browser | Progress saved via URL, resume on return |
| **Session** | Client opens URL on different device | Separate session (no cross-device sync in MVP) |
| **File upload** | File exceeds size limit | Block upload, show error with limit |
| **File upload** | Upload fails | Retry + option to use shared folder URL instead |
| **Admin** | Deletes questionnaire with responses | Confirmation modal, archive instead of delete |
| **Admin** | CSV upload malformed | Specific validation errors, provide template link |
| **Client** | Skips required question | Disable "Next" button, show inline error |
| **Client** | Idle session (30+ min) | No timeout, auto-save persists |

---

### 9.2 Error Message Principles

**Guidelines:**
- **Be specific:** "Microphone permission denied" not "Error 403"
- **Be actionable:** "Enable microphone in Settings" not "Cannot record"
- **Be reassuring:** "Your answers are saved" not "Connection lost"
- **Avoid blame:** "Having trouble uploading" not "You selected an invalid file"

**Tone:** Helpful, calm, non-technical

---

## 10. Open Questions & Future Considerations

### 10.1 Questions for Technical Validation (Architect)

1. **Voice API:** Web Speech API sufficient, or need third-party service (e.g., Deepgram, AssemblyAI) for Spanish + accuracy?
2. **Data storage:** Client-side storage strategy (LocalStorage, IndexedDB) for offline queueing?
3. **File storage:** Where to host uploaded files? (AWS S3, Cloudflare R2, etc.)
4. **URL generation:** How to ensure unique, unpredictable URLs? (Security considerations)
5. **Scalability:** Expected concurrent users? (Affects architecture decisions)

### 10.2 Post-MVP Research Topics

1. **Question optimization:** Which question types work best with voice? (Open-ended vs. short answer performance)
2. **Voice vs. text preference:** Do clients actually prefer voice, or is text faster for certain question types?
3. **Completion time distribution:** What % complete in <15 min vs. 15-30 min vs. >30 min? Identify bottlenecks.
4. **Abandonment analysis:** At which question do clients most often exit? (Optimize question order/content)
5. **Language usage:** What % of responses are in Spanish vs. English? (Informs UI localization priority)

### 10.3 Design Debt to Address Later

1. **Accessibility audit:** Full WCAG 2.1 AA compliance testing
2. **Internationalization:** Full Spanish UI (not just voice dictation)
3. **Dark mode:** Consider for admin portal (long-session usage)
4. **Advanced analytics dashboard:** Admin insights beyond basic response viewing
5. **Client communication:** In-app messaging or comment threads

---

## 11. Appendix

### 11.1 Sample Questionnaire (Illustrative)

**Client Intake: Agtech Vendor Consultation**

1. **Business Overview** (Open-ended, required)
   *"Describe your agtech company, including your core product/platform, target agricultural segment (e.g., precision ag, farm management, supply chain), and years in operation."*

2. **Annual Revenue** (Short answer, required)
   *"What is your current annual revenue or ARR? (Approximate is fine)"*

3. **Team Size** (Short answer, optional)
   *"How many full-time employees or team members do you have?"*

4. **Target Market** (Open-ended, required)
   *"Who are your primary customers? (e.g., growers, distributors, input suppliers, food companies). Describe your ideal customer profile."*

5. **Go-to-Market Strategy** (Open-ended, required)
   *"Describe your current sales and distribution strategy. How do you acquire and retain customers?"*

6. **Key Challenges** (Open-ended, required)
   *"What are the top 3 challenges your business is currently facing in reaching product-market fit or scaling?"*

7. **Product-Market Fit Assessment** (Open-ended, required)
   *"How well do you feel your product meets market demand? What evidence or metrics support this (e.g., retention, NPS, sales velocity)?"*

8. **Operational Bottlenecks** (Open-ended, optional)
   *"Are there any operational inefficiencies or bottlenecks limiting your growth (e.g., tech debt, hiring, supply chain)?"*

9. **Supporting Documentation** (File upload, optional)
   *"Upload recent financial statements, pitch deck, product roadmap, or provide a link to a shared folder with relevant documents."*

10. **Additional Context** (Open-ended, optional)
    *"Is there anything else we should know before our first consultation?"*

---

### 11.2 CSV Upload Template Format

```csv
question_text,question_type,required
"Describe your agtech company, including your core product/platform and target agricultural segment.",open_ended,true
"What is your current annual revenue or ARR?",short_answer,true
"How many team members do you have?",short_answer,false
"Upload supporting documents (pitch deck, financials) or provide shared folder link.",file_upload,false
```

**Column Definitions:**
- `question_text`: The question displayed to the client (max 500 characters)
- `question_type`: `open_ended`, `short_answer`, or `file_upload`
- `required`: `true` or `false`

---

### 11.3 Glossary

- **Admin:** The consultant or firm staff member who creates and manages questionnaires
- **Client:** The agtech vendor executive (founder, C-level, or senior collaborator) filling out the intake form
- **Questionnaire:** A set of questions created by the admin for a specific client engagement
- **Session:** A client's in-progress or completed questionnaire instance
- **Voice dictation:** Speech-to-text input method (primary input for clients)
- **Auto-save:** Automatic saving of client responses after each question
- **Progressive disclosure:** UX pattern of showing one question at a time
- **MVP:** Minimum Viable Product (Phase 1 feature set)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Product Design Agent | Initial comprehensive PRD |
| 1.1 | January 2026 | Product Design Agent | Updated client persona from agricultural firms to agtech vendors; Added markdown transcript export feature (P0) |

---

**Next Steps:**
1. **Technical Validation:** Share with Architect for feasibility review and technical constraints
2. **Stakeholder Review:** Validate assumptions with client (agricultural consultant)
3. **Design Mockups:** Create high-fidelity wireframes (if needed for clarity)
4. **Development Handoff:** Architect translates to technical specifications, assigns to front-end/back-end
5. **Testing Specifications:** Share with Tester for acceptance criteria and test plan creation

---

*End of Product Design Document*
