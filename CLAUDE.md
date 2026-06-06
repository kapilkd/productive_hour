# CLAUDE.md — LLM-Based Adaptive Learning Platform

> **Purpose:** This file is the single source of truth for the entire project — architecture, data models, APIs, LLM integration, audio engine, access control, and build plan. Refer to this before making any design or implementation decision. Update it whenever a decision changes.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Core User Roles](#2-core-user-roles)
3. [Application Flow](#3-application-flow)
4. [Tech Stack](#4-tech-stack)
5. [Repository Structure](#5-repository-structure)
6. [Database Schema](#6-database-schema)
7. [Backend API](#7-backend-api)
8. [Frontend Architecture](#8-frontend-architecture)
9. [LLM Integration — Question Engine](#9-llm-integration--question-engine)
10. [Audio Narration Engine](#10-audio-narration-engine)
11. [Student IQ Model](#11-student-iq-model)
12. [Access Control & Auth](#12-access-control--auth)
13. [Admin Panel](#13-admin-panel)
14. [Student App — Listening Mode](#14-student-app--listening-mode)
15. [Progress & Analytics](#15-progress--analytics)
16. [Environment Variables](#16-environment-variables)
17. [Phase-wise Build Plan](#17-phase-wise-build-plan)
18. [Deployment](#18-deployment)
19. [Known Decisions & Open Questions](#19-known-decisions--open-questions)

---

## 1. Project Vision

An LLM-powered adaptive learning platform where students **listen** to chapters rather than read them. Content is organized in a hierarchy: **Class → Subject → Chapter → Frames**. Each frame is narrated automatically using text-to-speech. After key frames, the LLM generates context-aware questions tuned to the student's current IQ score to reinforce retention and encourage progress.

**Core principles:**
- Student never needs to type or read — the app speaks to them.
- Questions are never too hard or too easy — they adapt to the student's demonstrated ability.
- Admin has full control over course structure and student access.
- Every interaction is tracked to build a longitudinal view of student progress.
- Web-first build, mobile (React Native) follows after web is stable.

---

## 2. Core User Roles

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Create admins, manage platform-wide settings |
| **Admin** | Create/edit courses, subjects, chapters, frames; assign subjects to students |
| **Student** | Access assigned subjects; listen to chapters; answer LLM questions; view own progress |

> There is no self-registration for students. Admins create student accounts and assign access.

---

## 3. Application Flow

### Admin flow
```
Login → Dashboard → Create Class → Add Subjects to Class
→ Add Chapters to Subject → Add Frames to Chapter (text + optional image)
→ Assign Subject to Student(s) → Monitor student progress
```

### Student flow
```
Login → My Subjects → Select Subject → Chapter List
→ Click Chapter → [Auto-starts listening mode]
→ Frame 1 narrated → Frame 2 narrated → ... → LLM Question appears
→ Student answers (voice or tap) → Feedback + Score update
→ Boost message → Next frame unlocks → ... → Chapter complete
→ Next chapter unlocked (if configured sequentially)
```

### Frame → Question trigger logic
- A question is triggered every N frames (configurable per subject, default: every 3 frames).
- The LLM receives the last N frame texts + student IQ score and generates one question.
- If the student answers correctly → IQ nudges up + positive boost message.
- If the student answers incorrectly → IQ nudges down + explanation + encouragement.

---

## 4. Tech Stack

### Frontend (Web)
| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + TypeScript | Component reuse for mobile later |
| Styling | Tailwind CSS | Fast, consistent, utility-first |
| State management | Zustand | Lightweight, no boilerplate |
| Audio player | Howler.js | Reliable cross-browser audio |
| Routing | React Router v6 | File-system-like routing |
| Forms | React Hook Form + Zod | Type-safe form validation |
| HTTP client | Axios | Interceptors for auth tokens |

### Backend
| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js 20 + TypeScript | Same language as frontend |
| Framework | Express.js | Lightweight, well-understood |
| ORM | Prisma | Type-safe DB access, easy migrations |
| Auth | JWT (access + refresh tokens) | Stateless, scalable |
| Queue | BullMQ + Redis | Async TTS generation jobs |
| File storage | AWS S3 (or Cloudflare R2) | Audio files, frame images |

### Database
| Layer | Choice |
|-------|--------|
| Primary DB | PostgreSQL 15 |
| Cache / sessions | Redis 7 |

### LLM
| Purpose | Provider |
|---------|---------|
| Question generation | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Narration text polish | Claude API (optional, to smooth admin-written content) |

### Text-to-Speech
| Option | Use case |
|--------|---------|
| ElevenLabs | High-quality, natural voice (production) |
| Google Cloud TTS | Lower cost fallback |
| Browser Web Speech API | Dev/testing only — no cost, lower quality |

### Mobile (Phase 4+)
- React Native + Expo — shares business logic and API layer with web.

---

## 5. Repository Structure

```
/
├── apps/
│   ├── web/                        # React frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── admin/          # Admin panel pages
│   │   │   │   └── student/        # Student app pages
│   │   │   ├── components/
│   │   │   │   ├── admin/
│   │   │   │   ├── student/
│   │   │   │   └── shared/
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── stores/             # Zustand stores
│   │   │   ├── services/           # Axios API wrappers
│   │   │   └── types/              # Shared TypeScript types
│   │   └── public/
│   └── mobile/                     # React Native (Phase 4)
│
├── api/                            # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── admin/
│   │   │   │   ├── courses.ts
│   │   │   │   ├── students.ts
│   │   │   │   └── analytics.ts
│   │   │   └── student/
│   │   │       ├── subjects.ts
│   │   │       ├── chapters.ts
│   │   │       └── progress.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification
│   │   │   └── rbac.ts             # Role-based access
│   │   ├── services/
│   │   │   ├── llm.service.ts      # Claude API calls
│   │   │   ├── tts.service.ts      # TTS generation
│   │   │   ├── iq.service.ts       # IQ score logic
│   │   │   └── storage.service.ts  # S3 file ops
│   │   ├── jobs/
│   │   │   └── tts.job.ts          # BullMQ TTS queue worker
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── utils/
│
├── shared/                         # Types shared between web + api
│   └── types/
│
├── docs/                           # Additional docs, diagrams
├── CLAUDE.md                       # This file
├── docker-compose.yml
└── .env.example
```

---

## 6. Database Schema

> All timestamps are UTC. Soft deletes (`deletedAt`) on core entities.

### Users
```sql
users
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name            TEXT NOT NULL
  email           TEXT UNIQUE NOT NULL
  password_hash   TEXT NOT NULL
  role            ENUM('super_admin', 'admin', 'student') NOT NULL
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMPTZ DEFAULT NOW()
  updated_at      TIMESTAMPTZ DEFAULT NOW()
  deleted_at      TIMESTAMPTZ
```

### Course hierarchy
```sql
classes
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL
  description     TEXT
  created_by      UUID REFERENCES users(id)
  created_at      TIMESTAMPTZ DEFAULT NOW()

subjects
  id              UUID PRIMARY KEY
  class_id        UUID REFERENCES classes(id)
  name            TEXT NOT NULL
  description     TEXT
  question_every_n_frames  INT DEFAULT 3    -- LLM question trigger interval
  sequential_chapters      BOOLEAN DEFAULT true
  created_by      UUID REFERENCES users(id)
  created_at      TIMESTAMPTZ DEFAULT NOW()

chapters
  id              UUID PRIMARY KEY
  subject_id      UUID REFERENCES subjects(id)
  title           TEXT NOT NULL
  description     TEXT
  order_index     INT NOT NULL              -- sort order within subject
  created_at      TIMESTAMPTZ DEFAULT NOW()

frames
  id              UUID PRIMARY KEY
  chapter_id      UUID REFERENCES chapters(id)
  order_index     INT NOT NULL              -- sort order within chapter
  content_text    TEXT NOT NULL             -- narrated text
  image_url       TEXT                      -- optional illustration
  audio_url       TEXT                      -- generated TTS audio (S3 URL)
  audio_status    ENUM('pending','generating','ready','failed') DEFAULT 'pending'
  duration_seconds FLOAT                   -- audio duration in seconds
  created_at      TIMESTAMPTZ DEFAULT NOW()
```

### Access control
```sql
student_subject_access
  id              UUID PRIMARY KEY
  student_id      UUID REFERENCES users(id)
  subject_id      UUID REFERENCES subjects(id)
  granted_by      UUID REFERENCES users(id)
  granted_at      TIMESTAMPTZ DEFAULT NOW()
  expires_at      TIMESTAMPTZ               -- optional expiry
  UNIQUE(student_id, subject_id)
```

### Progress tracking
```sql
student_chapter_progress
  id              UUID PRIMARY KEY
  student_id      UUID REFERENCES users(id)
  chapter_id      UUID REFERENCES chapters(id)
  status          ENUM('not_started','in_progress','completed') DEFAULT 'not_started'
  last_frame_index INT DEFAULT 0            -- which frame they left off at
  started_at      TIMESTAMPTZ
  completed_at    TIMESTAMPTZ
  UNIQUE(student_id, chapter_id)

student_frame_progress
  id              UUID PRIMARY KEY
  student_id      UUID REFERENCES users(id)
  frame_id        UUID REFERENCES frames(id)
  listened        BOOLEAN DEFAULT false
  listened_at     TIMESTAMPTZ
  UNIQUE(student_id, frame_id)
```

### IQ & Questions
```sql
student_iq_scores
  id              UUID PRIMARY KEY
  student_id      UUID REFERENCES users(id)
  subject_id      UUID REFERENCES subjects(id)
  score           INT DEFAULT 50            -- 0-100, starts at 50
  updated_at      TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(student_id, subject_id)

llm_questions
  id              UUID PRIMARY KEY
  student_id      UUID REFERENCES users(id)
  chapter_id      UUID REFERENCES chapters(id)
  trigger_frame_index INT                  -- which frame triggered this question
  question_text   TEXT NOT NULL
  options         JSONB                    -- [{label:'A', text:'...'}, ...]
  correct_option  TEXT                     -- 'A','B','C','D'
  difficulty      ENUM('easy','medium','hard')
  asked_at        TIMESTAMPTZ DEFAULT NOW()

student_question_responses
  id              UUID PRIMARY KEY
  question_id     UUID REFERENCES llm_questions(id)
  student_id      UUID REFERENCES users(id)
  selected_option TEXT
  is_correct      BOOLEAN
  iq_delta        INT                      -- how much IQ changed (+/-)
  response_time_seconds FLOAT
  responded_at    TIMESTAMPTZ DEFAULT NOW()
```

---

## 7. Backend API

### Base URL
- Dev: `http://localhost:4000/api/v1`
- Prod: `https://api.yourdomain.com/api/v1`

### Authentication endpoints
```
POST   /auth/login            Body: { email, password } → { accessToken, refreshToken, user }
POST   /auth/refresh          Body: { refreshToken }    → { accessToken }
POST   /auth/logout           Header: Authorization     → 200 OK
```

### Admin — Course management
```
GET    /admin/classes                          → List all classes
POST   /admin/classes                          → Create class
GET    /admin/classes/:id/subjects             → List subjects in class
POST   /admin/subjects                         → Create subject
PUT    /admin/subjects/:id                     → Update subject
GET    /admin/subjects/:id/chapters            → List chapters
POST   /admin/chapters                         → Create chapter
PUT    /admin/chapters/:id                     → Update chapter
DELETE /admin/chapters/:id                     → Soft delete chapter
GET    /admin/chapters/:id/frames              → List frames
POST   /admin/frames                           → Create frame (triggers TTS job)
PUT    /admin/frames/:id                       → Update frame (re-triggers TTS)
DELETE /admin/frames/:id                       → Delete frame
```

### Admin — Student management
```
GET    /admin/students                         → List all students
POST   /admin/students                         → Create student account
PUT    /admin/students/:id                     → Update student
POST   /admin/students/:id/access             → Grant subject access
DELETE /admin/students/:id/access/:subjectId  → Revoke access
GET    /admin/students/:id/progress            → Student's full progress report
GET    /admin/analytics/overview               → Platform-wide stats
```

### Student endpoints
```
GET    /student/subjects                       → My assigned subjects
GET    /student/subjects/:id/chapters          → Chapter list with progress status
GET    /student/chapters/:id                   → Chapter detail + frames + audio URLs
POST   /student/progress/frame                 Body: { frameId } → Mark frame listened
GET    /student/progress/chapter/:id           → My progress for a chapter
POST   /student/questions/:id/respond          Body: { selectedOption } → Score + feedback
GET    /student/iq/:subjectId                  → My IQ score for a subject
```

### Internal / async
```
POST   /internal/tts/webhook                   → TTS job completion callback
GET    /admin/frames/:id/tts-status            → Check TTS generation status
```

---

## 8. Frontend Architecture

### Route structure (web)
```
/login
/admin
  /admin/dashboard
  /admin/classes
  /admin/classes/:classId
  /admin/subjects/:subjectId
  /admin/chapters/:chapterId
  /admin/students
  /admin/students/:studentId
  /admin/analytics
/student
  /student/subjects
  /student/subjects/:subjectId
  /student/chapters/:chapterId/listen    ← The core listening experience
  /student/progress
```

### Key Zustand stores
```typescript
// Auth store
authStore: {
  user: User | null
  accessToken: string | null
  login(email, password): Promise<void>
  logout(): void
  refreshToken(): Promise<void>
}

// Player store (listening mode)
playerStore: {
  chapter: Chapter | null
  frames: Frame[]
  currentFrameIndex: number
  isPlaying: boolean
  playbackRate: number           // 0.75, 1, 1.25, 1.5
  currentQuestion: Question | null
  questionPhase: boolean         // true when question is showing
  play(): void
  pause(): void
  goToFrame(index: number): void
  markFrameComplete(): void
  submitAnswer(option: string): void
}

// Progress store
progressStore: {
  chapterProgress: Record<string, ChapterProgress>
  iqScores: Record<string, number>    // keyed by subjectId
  fetchProgress(subjectId): void
}
```

### Component hierarchy (listening mode)
```
ListenPage
├── ChapterHeader           (title, subject name, progress bar)
├── FramePlayer
│   ├── FrameContent        (text display, optional image)
│   ├── AudioController     (play/pause, seek, speed, prev/next frame)
│   └── FrameProgressDots   (dot per frame, filled = listened)
├── QuestionOverlay         (appears when LLM question triggers)
│   ├── QuestionText
│   ├── OptionButtons       (A/B/C/D)
│   └── FeedbackPanel       (correct/incorrect + boost message)
└── ChapterCompleteModal
```

---

## 9. LLM Integration — Question Engine

### Library
```bash
npm install @anthropic-ai/sdk
```

### Prompt structure
The prompt is assembled server-side in `llm.service.ts` before every question trigger.

```typescript
const systemPrompt = `
You are an adaptive educational assistant. Your job is to generate one multiple-choice 
question to assess a student's understanding of the content they just listened to.

Rules:
- Generate EXACTLY one question with 4 options labeled A, B, C, D.
- One option must be clearly correct. The others must be plausible but wrong.
- Match difficulty to the student's IQ score (0-100):
    0-30  → very simple recall questions
    31-60 → moderate comprehension questions
    61-80 → application-level questions
    81-100 → analysis or inference questions
- Keep the question under 30 words.
- Each option under 20 words.
- End with a one-sentence encouraging message for the student regardless of difficulty.
- Respond in strict JSON only. No markdown, no extra text.

JSON format:
{
  "question": "...",
  "options": [
    { "label": "A", "text": "..." },
    { "label": "B", "text": "..." },
    { "label": "C", "text": "..." },
    { "label": "D", "text": "..." }
  ],
  "correct": "A",
  "difficulty": "medium",
  "boost_message": "You're doing great — keep going!"
}
`.trim();

const userPrompt = `
Student IQ score for this subject: ${iqScore}/100
Chapter title: ${chapterTitle}
Recent frames the student just listened to:
${recentFrames.map((f, i) => `Frame ${i+1}: ${f.content_text}`).join('\n\n')}

Generate one adaptive question now.
`.trim();
```

### API call
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateQuestion(params: QuestionParams) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(raw);   // wrap in try/catch — retry once on parse fail
  return parsed;
}
```

### Error handling
- If JSON parse fails → retry once with a stricter prompt.
- If second attempt fails → skip question for this trigger, log error, continue to next frame.
- Never block audio playback due to LLM failure.

### Cost estimate
- Average question = ~400 input tokens + ~150 output tokens.
- At Claude Sonnet pricing: roughly $0.003 per question.
- 100 students × 20 questions per chapter × 10 chapters = 20,000 questions ≈ $60.

---

## 10. Audio Narration Engine

### How it works
1. Admin saves a frame (or updates frame text).
2. Backend enqueues a TTS job in BullMQ (Redis queue).
3. TTS worker picks up the job, calls TTS API with the frame text.
4. Audio file (MP3) is uploaded to S3.
5. Frame's `audio_url` and `audio_status` are updated in DB.
6. Frontend polls frame status or receives a WebSocket event when audio is ready.

### TTS job schema
```typescript
interface TTSJob {
  frameId: string;
  text: string;
  voiceId: string;         // ElevenLabs voice ID
  retryCount: number;
}
```

### ElevenLabs integration
```typescript
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const audio = await client.generate({
    voice: voiceId,
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  });
  return audio;   // Buffer — upload to S3
}
```

### S3 upload
```
s3://your-bucket/audio/frames/{frameId}.mp3
s3://your-bucket/images/frames/{frameId}.{ext}
```

### Frontend audio playback (Howler.js)
```typescript
import { Howl } from 'howler';

const sound = new Howl({
  src: [frame.audio_url],
  html5: true,
  rate: playerStore.playbackRate,  // 0.75 – 1.5
  onend: () => playerStore.markFrameComplete(),
  onloaderror: () => console.error('Audio load failed, skip frame'),
});

sound.play();
```

### Playback controls the student has
- Play / Pause
- Previous frame / Next frame
- Speed: 0.75× / 1× / 1.25× / 1.5×
- Chapter progress bar (jump to any listened frame)
- Volume (uses device volume by default)

> **Students cannot skip an unlistened frame** unless the admin enables free navigation for that subject.

---

## 11. Student IQ Model

### Score range
- 0–100. Every student starts at **50** per subject.
- Score is **per student per subject** (not global).

### Score update rules
```typescript
function updateIqScore(current: number, isCorrect: boolean, difficulty: 'easy'|'medium'|'hard'): number {
  const delta = {
    easy:   { correct: +2,  incorrect: -1 },
    medium: { correct: +4,  incorrect: -3 },
    hard:   { correct: +6,  incorrect: -5 },
  }[difficulty];

  const change = isCorrect ? delta.correct : delta.incorrect;
  return Math.max(0, Math.min(100, current + change));
}
```

### IQ → difficulty mapping (for LLM prompt)
| IQ range | Difficulty label | Description |
|----------|-----------------|-------------|
| 0–30 | easy | Simple recall of facts just heard |
| 31–60 | medium | Comprehension, "what does this mean?" |
| 61–80 | hard | Application, "how would you use this?" |
| 81–100 | hard | Inference, "what can we conclude?" |

### Boost messages (LLM-generated, appended per response)
- Correct: "Excellent! Your understanding is growing." / "That's right — you're making real progress!"
- Incorrect: "Not quite — here's what to remember: [explanation]. You'll get the next one!"

The LLM generates the boost message inline (part of the question JSON). Admin can also configure a static fallback message list in subject settings.

---

## 12. Access Control & Auth

### JWT strategy
```
Access token:  15 minutes TTL  (sent in Authorization header)
Refresh token: 7 days TTL      (stored in httpOnly cookie)
```

### Middleware stack (every API request)
```
Request → verifyJWT → attachUser → checkRole(allowedRoles) → handler
```

### Role checks
```typescript
// Route-level example
router.post('/admin/students', 
  verifyJWT, 
  requireRole(['admin', 'super_admin']),
  createStudentHandler
);

router.get('/student/subjects',
  verifyJWT,
  requireRole(['student']),
  getMySubjectsHandler
);
```

### Student data isolation
- Every student query is scoped by `student_id = req.user.id`.
- Students cannot access other students' data — enforced at query level in Prisma.
- Students can only see subjects they have an active, non-expired record in `student_subject_access`.

---

## 13. Admin Panel

### Dashboard widgets
- Total active students
- Total subjects published
- Average IQ score across platform
- Most and least completed chapters (last 30 days)
- Recent student activity log

### Course builder — key UX decisions
- **Drag-to-reorder** chapters and frames within a chapter.
- **Frame editor**: Rich text area (admin writes narration text) + optional image upload.
- **TTS preview button**: Admin can play the generated audio before publishing.
- **Publish / Draft toggle**: Chapters in draft are invisible to students.
- **Bulk assign**: Select multiple students → assign subject in one action.

### Student management table columns
```
Name | Email | Assigned Subjects | Last Active | Avg IQ Score | Actions
```

---

## 14. Student App — Listening Mode

### Entry point
Student taps a chapter → immediately see a "Starting..." spinner → audio begins within 2 seconds. No extra button press required on entry.

### Player states
```
idle          → No chapter loaded
loading       → Fetching frames + pre-loading first audio
playing       → Audio playing, frame text visible
paused        → Audio paused, controls visible
question      → LLM question overlay active (audio paused)
answered      → Feedback shown (correct/incorrect), boost message
complete      → Chapter done, next chapter button appears
error         → Audio failed, retry or skip offered
```

### Frame display during playback
- Large readable text of the current frame (18–22px, high contrast).
- Optional image centered above the text.
- Progress bar at top showing frames completed out of total.
- Subtle highlight/underline on currently narrating sentence (if feasible via timing data from TTS).

### Question overlay behavior
- Audio pauses automatically when question appears.
- Question fades in over 400ms.
- Student picks A/B/C/D by tapping.
- Correct: green highlight + boost message + IQ tick up (visible animation).
- Incorrect: red highlight + explanation sentence + IQ tick stays/drops.
- "Continue" button → question overlay fades out → audio resumes from next frame.

### Accessibility targets
- Font size adjustable (student preference, stored in localStorage).
- High-contrast mode toggle.
- All controls reachable by keyboard (Tab + Enter).
- Audio speed persisted across sessions.

---

## 15. Progress & Analytics

### Student-facing progress
- Per-subject: % chapters completed, current IQ score trend.
- Per-chapter: frames listened, questions answered, accuracy rate.
- Streak tracking: consecutive days of study (motivational).

### Admin-facing analytics
- Per-student: IQ score over time (line chart), question accuracy per subject.
- Per-chapter: average completion rate, average time to complete, drop-off frame (which frame most students stop at).
- Per-subject: enrolled students, active last 7 days, average IQ score.

### Data aggregation strategy
- Raw events stored in `student_frame_progress` and `student_question_responses`.
- Aggregated stats computed on-demand for admin dashboard (cached in Redis for 5 minutes).
- Daily snapshot job (cron, midnight IST) writes summary rows to `daily_stats` table for fast reporting.

---

## 16. Environment Variables

### API (`api/.env`)
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/learndb
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# LLM
ANTHROPIC_API_KEY=sk-ant-...

# TTS
ELEVENLABS_API_KEY=...
ELEVENLABS_DEFAULT_VOICE_ID=...
GOOGLE_TTS_API_KEY=...              # fallback

# Storage
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket-name
S3_BASE_URL=https://your-bucket.s3.ap-south-1.amazonaws.com

# Internal
INTERNAL_API_SECRET=...             # for TTS webhook auth
```

### Web (`apps/web/.env`)
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_ENV=development
```

---

## 17. Phase-wise Build Plan

### Phase 1 — Foundation (Weeks 1–4)
**Goal:** Admin can create courses and students can log in and see their subjects.

- [ ] Project scaffold: monorepo, TypeScript, Eslint, Prettier
- [ ] PostgreSQL + Prisma schema (all tables from Section 6)
- [ ] Auth API: login, refresh, logout
- [ ] JWT middleware + role guards
- [ ] Admin: Create class / subject / chapter / frames (text only, no audio yet)
- [ ] Admin: Create student accounts + assign subjects
- [ ] Student: Login → see assigned subjects → see chapter list
- [ ] Basic chapter detail page (text only, manual scroll)
- [ ] Redis + BullMQ setup (queue ready, no jobs yet)

**Deliverable:** Admin can build a full course. Student can log in and read it.

---

### Phase 2 — Audio Engine (Weeks 5–8)
**Goal:** Chapters auto-narrate frame by frame.

- [ ] TTS job worker (ElevenLabs integration)
- [ ] S3 upload for audio files
- [ ] Frame `audio_url` + `audio_status` populated after admin saves frame
- [ ] Admin TTS preview in frame editor
- [ ] Frontend: Howler.js player integrated in ListenPage
- [ ] Auto-play on chapter open (first frame starts within 2s)
- [ ] Play / Pause / Speed controls
- [ ] Frame progress dots UI
- [ ] Mark frame as listened on audio end → stored in DB
- [ ] Resume from last frame on re-open

**Deliverable:** Student opens a chapter and it narrates automatically, frame by frame.

---

### Phase 3 — LLM Question Engine (Weeks 9–12)
**Goal:** Adaptive questions appear after frames, IQ score updates.

- [ ] `llm.service.ts`: Claude API integration with prompt template from Section 9
- [ ] Question trigger logic: every N frames (configurable per subject)
- [ ] `llm_questions` table populated on trigger
- [ ] Question overlay UI component (QuestionOverlay)
- [ ] Answer submission API + IQ score update (Section 11 logic)
- [ ] Boost message display (correct / incorrect flows)
- [ ] Student IQ score shown on subject card and per-chapter header
- [ ] IQ score history chart on student profile
- [ ] Admin: configure `question_every_n_frames` per subject

**Deliverable:** Full adaptive learning loop — listen → question → answer → boost → continue.

---

### Phase 4 — Analytics + Polish (Weeks 13–16)
**Goal:** Admin has visibility; student has motivation; app is production-ready.

- [ ] Admin analytics dashboard (Section 15 widgets)
- [ ] Student progress page (streaks, accuracy, IQ trend)
- [ ] Chapter sequential unlock logic
- [ ] High-contrast + font-size accessibility settings
- [ ] Error handling: audio fail → graceful skip with message
- [ ] LLM error handling: question skip on failure (Section 9)
- [ ] Rate limiting on API endpoints
- [ ] Email on student account creation (password setup link)
- [ ] Mobile PWA: add manifest + service worker for offline audio caching
- [ ] Load testing: 100 concurrent students

**Deliverable:** Production-ready web app.

---

### Phase 5 — Mobile App (After web is stable)
- React Native + Expo scaffold
- Shared API services layer (no duplication)
- Native audio player (Expo AV)
- Push notifications for study reminders
- App Store + Play Store submission

---

## 18. Deployment

### Infrastructure (recommended for India-based usage)
```
Frontend:    Vercel (free tier sufficient initially)
API:         Railway or Render (Node.js, auto-deploys from Git)
Database:    Supabase (managed PostgreSQL + free tier)
Redis:       Upstash (managed Redis, pay-per-use)
Storage:     AWS S3 ap-south-1 (Mumbai region) or Cloudflare R2
CDN:         Cloudflare (for audio files — low latency in India)
```

### CI/CD
- GitHub Actions: lint → test → build → deploy on merge to `main`.
- Separate staging environment on a `staging` branch.

### Monitoring
- Sentry: frontend + backend error tracking.
- Better Uptime (or UptimeRobot): API health check every minute.
- Logs: Railway/Render built-in log streaming (upgrade to Datadog if needed).

### Backup strategy
- PostgreSQL: daily automated backup (Supabase handles this).
- S3 audio files: versioning enabled on bucket.
- `.env` secrets: stored in GitHub Secrets + 1Password.

---

## 19. Known Decisions & Open Questions

### Decided
| Decision | Choice | Reason |
|----------|--------|--------|
| Web before mobile | Yes | Faster iteration, better LLM SDK support |
| LLM provider | Anthropic Claude | Best instruction-following for structured JSON output |
| TTS provider | ElevenLabs (primary) | Most natural Hindi/English voice for Indian students |
| DB | PostgreSQL | Relational data fits course hierarchy well |
| State management | Zustand | Simpler than Redux for this scale |
| Audio library | Howler.js | Reliable cross-browser, playback rate control |
| IQ start score | 50 | Neutral starting point, moves up or down based on answers |

### Open questions (needs your decision)
| # | Question | Options |
|---|----------|---------|
| 1 | Will the app support Hindi narration? | Yes → use ElevenLabs multilingual v2 / No → English only |
| 2 | Can students skip a frame without listening? | Free skip / Must listen first / Admin configurable |
| 3 | Should questions be voice-answered or tap only? | Tap-only (simpler) / Voice via Web Speech API |
| 4 | Multi-school / multi-tenant? | Single-school MVP / Multi-tenant from start |
| 5 | Pricing model? | Subscription / Per-student / Free for now |
| 6 | Should admin be able to upload audio manually? | Yes (bypass TTS) / No (TTS only) |
| 7 | Should IQ scores reset per academic year? | Yes / No / Admin-controlled |
| 8 | Offline mode for students? | PWA cache only / Full offline via React Native |

---

*Last updated: June 2026. Update this file whenever architecture, stack, or scope decisions change. Every new session with Claude should reference this file first.*
