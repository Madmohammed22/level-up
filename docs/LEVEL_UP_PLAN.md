

# LEVEL UP — Complete Implementation Plan

## A Tutoring Center Management System

**Mentor note:** This is your blueprint. Read it once end-to-end, then use it as a reference as you build each feature. Every file path, every command, every design decision is intentional. When something seems arbitrary, re-read the "Why it matters" section — there is always a reason.

---

## 0. Before You Start — Prerequisites

### Software to Install

| Tool | Version | Why | Install Command |
|------|---------|-----|-----------------|
| Node.js | 20 LTS or later | Runtime for Next.js | `brew install node@20` (macOS) or use [nvm](https://github.com/nvm-sh/nvm) |
| pnpm | 9+ | Fast, disk-efficient package manager | `corepack enable && corepack prepare pnpm@latest --activate` |
| Git | 2.40+ | Version control | `brew install git` |
| PostgreSQL client | 16+ | Local CLI tools (psql) | `brew install postgresql@16` |
| VS Code | Latest | Editor | [Download](https://code.visualstudio.com/) |

### Accounts to Create (Free Tier)

1. **Supabase** — https://supabase.com (database + auth + realtime)
2. **Vercel** — https://vercel.com (deployment)
3. **GitHub** — https://github.com (code hosting, CI)

### VS Code Extensions

Install these — they will save you hours:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-playwright.playwright
```

### Supabase Project Setup

1. Go to https://supabase.com/dashboard, click "New Project"
2. Name it `level-up`, choose a region close to your users (e.g., `eu-west-1` for France)
3. Set a strong database password — save it somewhere safe
4. Once created, go to Settings > API and note down:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key (`SUPABASE_SERVICE_ROLE_KEY`) — never expose this client-side
5. Go to Settings > Database and note down the connection string (`DATABASE_URL`)
   - Use the "Connection pooling" URI with `?pgbouncer=true` for Prisma

---

## 1. Project Setup — Step by Step

### Step 1: Create the Next.js project

```bash
pnpm create next-app@latest level-up \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint
```

```bash
cd level-up
```

### Step 2: Install production dependencies

```bash
pnpm add @prisma/client @supabase/ssr @supabase/supabase-js \
  zod @tanstack/react-query recharts date-fns \
  lucide-react clsx class-variance-authority \
  tailwind-merge
```

### Step 3: Install dev dependencies

```bash
pnpm add -D prisma vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom jsdom \
  @playwright/test @types/node
```

### Step 4: Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add the components you will use most:

```bash
pnpm dlx shadcn@latest add button card input label select \
  dialog sheet table tabs badge avatar separator \
  dropdown-menu tooltip calendar form textarea slider
```

### Step 5: Initialize Prisma

```bash
pnpm dlx prisma init
```

This creates `prisma/schema.prisma` and a `.env` file. Delete the `.env` file — we will use `.env.local` instead (Next.js convention, auto-ignored by git).

### Step 6: Create environment files

Create `.env.local.example` at the project root:

```env
# Database (Supabase PostgreSQL — use the pooled connection string)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Then copy it:

```bash
cp .env.local.example .env.local
# Now fill in your actual values
```

### Step 7: Configure Vitest

Create `vitest.config.ts` at the project root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

### Step 8: Configure Playwright

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

### Step 9: Add scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

Install `tsx` for running the seed script:

```bash
pnpm add -D tsx
```

### Step 10: Initialize Git

```bash
git init
git add .
git commit -m "chore: initial project setup with Next.js 14, Prisma, Supabase"
```

---

## 2. Full File Structure

```
level-up/
├── prisma/
│   ├── schema.prisma                    # Database models, enums, relations
│   ├── seed.ts                          # Seed data for development
│   └── migrations/                      # Auto-generated migration SQL files
│
├── public/
│   └── images/                          # Static assets: logo, illustrations
│       ├── logo.svg
│       ├── hero-illustration.svg
│       └── og-image.png                 # OpenGraph image for SEO
│
├── src/
│   ├── app/                             # Next.js App Router — pages and API routes
│   │   ├── (landing)/                   # Public-facing marketing pages
│   │   │   ├── page.tsx                 # Landing page ("Réussir ses examens sans stress")
│   │   │   └── layout.tsx               # Landing layout (no sidebar, public nav)
│   │   │
│   │   ├── (auth)/                      # Authentication pages
│   │   │   ├── login/page.tsx           # Email + password login form
│   │   │   ├── register/page.tsx        # Registration (admin creates accounts)
│   │   │   └── layout.tsx               # Centered card layout, no nav
│   │   │
│   │   ├── (dashboard)/                 # Authenticated area — all role dashboards
│   │   │   ├── layout.tsx               # Protected layout: session check + sidebar
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx             # Admin dashboard home (stats overview)
│   │   │   │   ├── students/page.tsx    # Student CRUD table
│   │   │   │   ├── teachers/page.tsx    # Teacher CRUD table
│   │   │   │   ├── rooms/page.tsx       # Room + time slot management
│   │   │   │   ├── sessions/page.tsx    # Session calendar + editor
│   │   │   │   ├── assignments/page.tsx # Auto-assignment: run, review, approve
│   │   │   │   ├── chat/page.tsx        # Admin inbox: all student conversations
│   │   │   │   └── content/page.tsx     # Methodology content editor
│   │   │   │
│   │   │   ├── teacher/
│   │   │   │   ├── page.tsx             # Teacher dashboard home
│   │   │   │   ├── schedule/page.tsx    # Teacher weekly schedule
│   │   │   │   └── students/page.tsx    # Students in teacher's sessions
│   │   │   │
│   │   │   └── student/
│   │   │       ├── page.tsx             # Student dashboard home
│   │   │       ├── schedule/page.tsx    # Student weekly schedule (read-only)
│   │   │       ├── chat/page.tsx        # Chat with admin
│   │   │       ├── methodology/page.tsx # Stress & methodology hub
│   │   │       └── mood/page.tsx        # Mood check-in history
│   │   │
│   │   ├── api/                         # Route Handlers (REST endpoints)
│   │   │   ├── leads/route.ts           # POST: landing page CTA form
│   │   │   ├── assignments/route.ts     # POST: trigger auto-assignment
│   │   │   ├── notifications/route.ts   # GET: fetch user notifications
│   │   │   └── webhooks/route.ts        # POST: Supabase auth webhooks
│   │   │
│   │   ├── layout.tsx                   # Root layout: html, body, providers
│   │   └── globals.css                  # Tailwind directives + custom CSS vars
│   │
│   ├── components/                      # All React components
│   │   ├── ui/                          # shadcn/ui primitives (auto-generated)
│   │   │
│   │   ├── shared/                      # App-wide layout + utility components
│   │   │   ├── Navbar.tsx               # Top nav bar (landing + auth pages)
│   │   │   ├── Sidebar.tsx              # Dashboard sidebar navigation
│   │   │   ├── NotificationBell.tsx     # Bell icon with unread count badge
│   │   │   └── RoleGuard.tsx            # Renders children only if user has role
│   │   │
│   │   ├── landing/                     # Landing page sections
│   │   │   ├── Hero.tsx                 # Hero banner with CTA
│   │   │   ├── ProblemSection.tsx       # "Le stress des examens..."
│   │   │   ├── SolutionSection.tsx      # How LEVEL UP solves it
│   │   │   ├── FeaturesSection.tsx      # Feature cards grid
│   │   │   ├── ResultsSection.tsx       # Social proof / statistics
│   │   │   └── CTAForm.tsx              # "Réserver une séance" form
│   │   │
│   │   ├── providers/                   # React context providers
│   │   │   ├── QueryProvider.tsx        # TanStack Query provider
│   │   │   └── SupabaseProvider.tsx     # Supabase client provider
│   │   │
│   │   └── features/                    # Feature-specific components
│   │       ├── students/
│   │       │   ├── StudentForm.tsx       # Create/edit student form
│   │       │   └── StudentList.tsx       # Filterable student table
│   │       ├── teachers/
│   │       │   ├── TeacherForm.tsx       # Create/edit teacher form
│   │       │   └── TeacherAvailabilityEditor.tsx  # Day x timeslot grid
│   │       ├── sessions/
│   │       │   ├── SessionCalendar.tsx   # Weekly calendar view
│   │       │   └── SessionForm.tsx       # Create/edit session dialog
│   │       ├── assignments/
│   │       │   ├── AssignmentDraft.tsx   # Review proposed sessions
│   │       │   └── CompatibilityMatrix.tsx  # Level compatibility editor
│   │       ├── chat/
│   │       │   ├── ChatBubble.tsx        # Single message bubble
│   │       │   └── ConversationList.tsx  # Sidebar list of conversations
│   │       ├── wellbeing/
│   │       │   ├── MoodSlider.tsx        # 1-5 mood rating slider
│   │       │   ├── BreathingExercise.tsx # Animated breathing guide
│   │       │   └── StressHeatmap.tsx     # Grid heatmap of mood data
│   │       └── dashboard/
│   │           ├── FillRateGauge.tsx     # Recharts radial gauge
│   │           ├── EnrollmentChart.tsx   # Bar chart by subject/level
│   │           └── StatsCards.tsx        # Stat summary cards
│   │
│   ├── server/                          # Server-side code (never sent to browser)
│   │   ├── db/
│   │   │   └── prisma.ts               # Prisma client singleton
│   │   │
│   │   ├── domain/                      # Pure business logic (no I/O, no DB)
│   │   │   ├── scheduling/
│   │   │   │   ├── assignment.ts        # Core assignment algorithm
│   │   │   │   ├── conflicts.ts         # Time conflict detection
│   │   │   │   └── compatibility.ts     # Level merging rules
│   │   │   ├── wellbeing/
│   │   │   │   ├── moodAggregation.ts   # Mood trend calculation
│   │   │   │   └── examProtocol.ts      # Pre-exam action generator
│   │   │   ├── messaging/
│   │   │   │   └── chat.ts              # Message formatting, validation
│   │   │   └── analytics/
│   │   │       └── fillRate.ts          # Fill rate computation
│   │   │
│   │   ├── services/                    # Orchestration: domain + DB + side effects
│   │   │   ├── studentService.ts
│   │   │   ├── teacherService.ts
│   │   │   ├── sessionService.ts
│   │   │   ├── assignmentService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── leadService.ts
│   │   │
│   │   ├── actions/                     # Next.js Server Actions (form handlers)
│   │   │   ├── students.ts
│   │   │   ├── sessions.ts
│   │   │   ├── assignments.ts
│   │   │   ├── leads.ts
│   │   │   └── mood.ts
│   │   │
│   │   └── auth/
│   │       ├── supabase.ts              # Supabase admin client (service role)
│   │       ├── getUser.ts               # Get current user from cookies
│   │       └── requireRole.ts           # Throw if user lacks required role
│   │
│   ├── lib/                             # Shared utilities (client + server safe)
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   └── server.ts               # Server Supabase client (reads cookies)
│   │   ├── utils.ts                     # cn() helper, date formatters
│   │   └── constants.ts                 # App-wide constants (roles, levels, etc.)
│   │
│   ├── types/
│   │   ├── schemas.ts                   # Zod schemas (validation + type inference)
│   │   └── domain.ts                    # TypeScript types for domain logic
│   │
│   └── tests/
│       ├── unit/
│       │   ├── scheduling/
│       │   │   ├── assignment.test.ts   # Assignment algorithm tests
│       │   │   └── conflicts.test.ts    # Conflict detection tests
│       │   └── analytics/
│       │       └── fillRate.test.ts     # Fill rate computation tests
│       └── e2e/
│           ├── admin-assign.spec.ts     # Full assignment flow
│           ├── student-schedule.spec.ts # Student views schedule
│           └── landing-cta.spec.ts      # Landing form submission
│
├── .env.local.example                   # Template for environment variables
├── .gitignore
├── next.config.ts                       # Next.js configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts                     # Unit test configuration
├── playwright.config.ts                 # E2E test configuration
└── README.md
```

### Folder Roles Summary

| Folder | Role |
|--------|------|
| `prisma/` | Database schema definition, migrations, and seed data. This is your source of truth for data structure. |
| `public/` | Static files served directly (images, fonts). No processing. |
| `src/app/` | Next.js App Router. Each folder maps to a URL route. Route groups `(landing)`, `(auth)`, `(dashboard)` share layouts without affecting URLs. |
| `src/components/` | All React components. `ui/` is shadcn primitives you never edit. `shared/` is cross-feature. `features/` is organized by domain. |
| `src/server/` | Server-only code. `domain/` is pure logic (no I/O). `services/` orchestrate domain + database. `actions/` are Next.js Server Actions. `auth/` handles authentication. |
| `src/lib/` | Shared utilities safe for both client and server. Supabase client factories live here. |
| `src/types/` | Zod schemas (runtime validation) and TypeScript types (compile-time safety). |
| `src/tests/` | All test files. Unit tests use Vitest. E2E tests use Playwright. |

---

## 3. Database Schema (Prisma)

### Complete `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── ENUMS ───────────────────────────────────────────────

enum UserRole {
  ADMIN
  TEACHER
  STUDENT
}

enum Level {
  PRIMAIRE
  COLLEGE_6EME
  COLLEGE_5EME
  COLLEGE_4EME
  COLLEGE_3EME
  LYCEE_2NDE
  LYCEE_1ERE
  LYCEE_TERMINALE
  SUPERIEUR
}

enum ContentType {
  MICRO_LESSON
  EXERCISE
  PROTOCOL
  TEMPLATE
}

enum ContentCategory {
  STRESS_MANAGEMENT
  METHODOLOGY
  TIME_MANAGEMENT
  EXAM_PREPARATION
  MOTIVATION
}

enum NotificationType {
  SESSION_ASSIGNED
  SESSION_CANCELLED
  SESSION_MOVED
  NEW_MESSAGE
  EXAM_APPROACHING
  MOOD_REMINDER
}

enum MoodType {
  PRE_SESSION
  POST_SESSION
  DAILY
}

enum SessionStatus {
  DRAFT
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum EnrollmentStatus {
  ACTIVE
  DROPPED
  COMPLETED
}

enum LeadStatus {
  NEW
  CONTACTED
  ENROLLED
  LOST
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// ─── MODELS ──────────────────────────────────────────────

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String
  lastName  String
  phone     String?
  role      UserRole
  avatarUrl String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Supabase Auth ID — links this row to the Supabase auth.users table
  supabaseAuthId String @unique

  studentProfile StudentProfile?
  teacherProfile TeacherProfile?
  notifications  Notification[]
  sentMessages   Message[]
  auditLogs      AuditLog[]

  // Chat
  conversationsAsStudent Conversation[] @relation("StudentConversation")
  conversationsAsAdmin   Conversation[] @relation("AdminConversation")

  @@index([role])
  @@index([supabaseAuthId])
}

model StudentProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  level       Level
  schoolName  String?
  parentName  String?
  parentPhone String?
  parentEmail String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subjects             StudentSubject[]
  availability         StudentAvailability[]
  enrollments          Enrollment[]
  moodCheckIns         MoodCheckIn[]
  contentCompletions   ContentCompletion[]
  examDates            ExamDate[]

  @@index([level])
}

model TeacherProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subjects     TeacherSubject[]
  availability TeacherAvailability[]
  sessions     Session[]
}

model Subject {
  id        String   @id @default(uuid())
  name      String   @unique  // e.g. "Mathématiques", "Français", "Physique-Chimie"
  color     String   @default("#3B82F6")  // For calendar display
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  students             StudentSubject[]
  teachers             TeacherSubject[]
  sessions             Session[]
  sessionTemplates     SessionTemplate[]
  levelCompatibilities LevelCompatibility[]
}

model StudentSubject {
  id        String         @id @default(uuid())
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subjectId String
  subject   Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([studentId, subjectId])
}

model TeacherSubject {
  id        String         @id @default(uuid())
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subjectId String
  subject   Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([teacherId, subjectId])
}

model Room {
  id        String   @id @default(uuid())
  name      String   @unique  // e.g. "Salle A", "Salle B"
  capacity  Int      @default(10)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  sessions         Session[]
  sessionTemplates SessionTemplate[]
}

model TimeSlot {
  id        String    @id @default(uuid())
  dayOfWeek DayOfWeek
  startTime String    // "16:00" — stored as string, parsed by app
  endTime   String    // "17:30"
  label     String?   // "Lundi 16h-17h30" — display label
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())

  teacherAvailabilities TeacherAvailability[]
  studentAvailabilities StudentAvailability[]
  sessions              Session[]
  sessionTemplates      SessionTemplate[]

  @@unique([dayOfWeek, startTime, endTime])
  @@index([dayOfWeek])
}

model TeacherAvailability {
  id         String         @id @default(uuid())
  teacherId  String
  teacher    TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  timeSlotId String
  timeSlot   TimeSlot       @relation(fields: [timeSlotId], references: [id], onDelete: Cascade)

  @@unique([teacherId, timeSlotId])
}

model StudentAvailability {
  id         String         @id @default(uuid())
  studentId  String
  student    StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  timeSlotId String
  timeSlot   TimeSlot       @relation(fields: [timeSlotId], references: [id], onDelete: Cascade)

  @@unique([studentId, timeSlotId])
}

model SessionTemplate {
  id         String        @id @default(uuid())
  subjectId  String
  subject    Subject       @relation(fields: [subjectId], references: [id])
  roomId     String
  room       Room          @relation(fields: [roomId], references: [id])
  timeSlotId String
  timeSlot   TimeSlot      @relation(fields: [timeSlotId], references: [id])
  maxStudents Int          @default(10)
  isActive   Boolean       @default(true)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  sessions   Session[]

  @@unique([roomId, timeSlotId])  // A room can only have one template per slot
}

model Session {
  id             String        @id @default(uuid())
  templateId     String?
  template       SessionTemplate? @relation(fields: [templateId], references: [id])
  subjectId      String
  subject        Subject       @relation(fields: [subjectId], references: [id])
  teacherId      String
  teacher        TeacherProfile @relation(fields: [teacherId], references: [id])
  roomId         String
  room           Room          @relation(fields: [roomId], references: [id])
  timeSlotId     String
  timeSlot       TimeSlot      @relation(fields: [timeSlotId], references: [id])
  date           DateTime      // Specific date this session occurs
  status         SessionStatus @default(DRAFT)
  notes          String?
  maxStudents    Int           @default(10)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  enrollments    Enrollment[]
  moodCheckIns   MoodCheckIn[]

  @@unique([roomId, timeSlotId, date])  // No double-booking
  @@index([date])
  @@index([teacherId])
  @@index([status])
}

model Enrollment {
  id         String           @id @default(uuid())
  sessionId  String
  session    Session          @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  studentId  String
  student    StudentProfile   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status     EnrollmentStatus @default(ACTIVE)
  enrolledAt DateTime         @default(now())

  @@unique([sessionId, studentId])  // No double-enrollment
  @@index([studentId])
}

model LevelCompatibility {
  id        String  @id @default(uuid())
  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  levelA    Level
  levelB    Level
  score     Float   @default(0)  // 0.0 = incompatible, 1.0 = perfect match

  @@unique([subjectId, levelA, levelB])
  @@index([subjectId])
}

model Conversation {
  id         String   @id @default(uuid())
  studentId  String
  student    User     @relation("StudentConversation", fields: [studentId], references: [id])
  adminId    String?
  admin      User?    @relation("AdminConversation", fields: [adminId], references: [id])
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  messages   Message[]

  @@unique([studentId])  // One conversation per student
  @@index([adminId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  content        String
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
  @@index([senderId])
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false)
  metadata  Json?            // Flexible payload: { sessionId, messageId, etc. }
  createdAt DateTime         @default(now())

  @@index([userId, isRead])
  @@index([createdAt])
}

model MoodCheckIn {
  id         String          @id @default(uuid())
  studentId  String
  student    StudentProfile  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  sessionId  String?
  session    Session?        @relation(fields: [sessionId], references: [id])
  type       MoodType
  score      Int             // 1-5 scale
  note       String?
  createdAt  DateTime        @default(now())

  @@index([studentId, createdAt])
  @@index([sessionId])
}

model ContentItem {
  id          String          @id @default(uuid())
  title       String
  description String?
  type        ContentType
  category    ContentCategory
  content     Json            // Flexible: { markdown, videoUrl, steps[], duration }
  sortOrder   Int             @default(0)
  isPublished Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  completions ContentCompletion[]
}

model ContentCompletion {
  id          String         @id @default(uuid())
  studentId   String
  student     StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  contentId   String
  content     ContentItem    @relation(fields: [contentId], references: [id], onDelete: Cascade)
  completedAt DateTime       @default(now())

  @@unique([studentId, contentId])
}

model ExamDate {
  id        String         @id @default(uuid())
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subjectName String       // Free text — might not match Subject table
  examDate  DateTime
  notes     String?
  createdAt DateTime       @default(now())

  @@index([studentId])
  @@index([examDate])
}

model LeadSubmission {
  id         String     @id @default(uuid())
  firstName  String
  lastName   String
  email      String
  phone      String?
  childLevel Level?
  subjects   String[]   // Array of subject names
  message    String?
  status     LeadStatus @default(NEW)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@index([status])
  @@index([createdAt])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // "student.create", "session.cancel", etc.
  entityType String   // "Student", "Session", etc.
  entityId   String
  metadata   Json?    // Before/after values
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Migration Commands

```bash
# Create the first migration
pnpm prisma migrate dev --name init

# Generate the Prisma client
pnpm prisma generate

# Seed the database
pnpm db:seed
```

### Seed File: `prisma/seed.ts`

```ts
import { PrismaClient, DayOfWeek, Level, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Subjects ──
  const math = await prisma.subject.create({
    data: { name: "Mathématiques", color: "#3B82F6" },
  });
  const french = await prisma.subject.create({
    data: { name: "Français", color: "#EF4444" },
  });
  const physics = await prisma.subject.create({
    data: { name: "Physique-Chimie", color: "#10B981" },
  });

  // ── Rooms ──
  const roomA = await prisma.room.create({
    data: { name: "Salle A", capacity: 10 },
  });
  const roomB = await prisma.room.create({
    data: { name: "Salle B", capacity: 10 },
  });

  // ── Time Slots (10 slots across the week) ──
  const slotData = [
    { dayOfWeek: DayOfWeek.MONDAY, startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: DayOfWeek.MONDAY, startTime: "17:30", endTime: "19:00" },
    { dayOfWeek: DayOfWeek.TUESDAY, startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: DayOfWeek.TUESDAY, startTime: "17:30", endTime: "19:00" },
    { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "14:00", endTime: "15:30" },
    { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "15:30", endTime: "17:00" },
    { dayOfWeek: DayOfWeek.THURSDAY, startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: DayOfWeek.THURSDAY, startTime: "17:30", endTime: "19:00" },
    { dayOfWeek: DayOfWeek.SATURDAY, startTime: "10:00", endTime: "11:30" },
    { dayOfWeek: DayOfWeek.SATURDAY, startTime: "11:30", endTime: "13:00" },
  ];

  const timeSlots = await Promise.all(
    slotData.map((s) =>
      prisma.timeSlot.create({
        data: {
          ...s,
          label: `${s.dayOfWeek.slice(0, 3)} ${s.startTime}-${s.endTime}`,
        },
      })
    )
  );

  // ── Admin User ──
  const admin = await prisma.user.create({
    data: {
      email: "admin@levelup.fr",
      firstName: "Marie",
      lastName: "Dupont",
      role: UserRole.ADMIN,
      supabaseAuthId: "seed-admin-id", // Replace with real ID after Supabase signup
    },
  });

  // ── Teachers (2) ──
  const teacher1 = await prisma.user.create({
    data: {
      email: "prof.martin@levelup.fr",
      firstName: "Jean",
      lastName: "Martin",
      role: UserRole.TEACHER,
      supabaseAuthId: "seed-teacher-1",
      teacherProfile: {
        create: {
          bio: "Professeur de mathématiques, 10 ans d'expérience",
          subjects: {
            create: [{ subjectId: math.id }, { subjectId: physics.id }],
          },
          availability: {
            create: timeSlots.slice(0, 6).map((ts) => ({ timeSlotId: ts.id })),
          },
        },
      },
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "prof.petit@levelup.fr",
      firstName: "Sophie",
      lastName: "Petit",
      role: UserRole.TEACHER,
      supabaseAuthId: "seed-teacher-2",
      teacherProfile: {
        create: {
          bio: "Professeure de français et méthodologie",
          subjects: {
            create: [{ subjectId: french.id }],
          },
          availability: {
            create: timeSlots.slice(4, 10).map((ts) => ({ timeSlotId: ts.id })),
          },
        },
      },
    },
  });

  // ── Students (10) ──
  const studentNames = [
    { first: "Lucas", last: "Bernard", level: Level.COLLEGE_3EME },
    { first: "Emma", last: "Robert", level: Level.COLLEGE_3EME },
    { first: "Hugo", last: "Richard", level: Level.COLLEGE_4EME },
    { first: "Chloé", last: "Durand", level: Level.COLLEGE_4EME },
    { first: "Nathan", last: "Moreau", level: Level.LYCEE_2NDE },
    { first: "Léa", last: "Simon", level: Level.LYCEE_2NDE },
    { first: "Louis", last: "Laurent", level: Level.LYCEE_1ERE },
    { first: "Jade", last: "Michel", level: Level.LYCEE_1ERE },
    { first: "Raphaël", last: "Garcia", level: Level.LYCEE_TERMINALE },
    { first: "Manon", last: "Thomas", level: Level.LYCEE_TERMINALE },
  ];

  for (const [i, s] of studentNames.entries()) {
    await prisma.user.create({
      data: {
        email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}@email.com`,
        firstName: s.first,
        lastName: s.last,
        role: UserRole.STUDENT,
        supabaseAuthId: `seed-student-${i + 1}`,
        studentProfile: {
          create: {
            level: s.level,
            subjects: {
              create: [
                { subjectId: math.id },
                ...(i % 2 === 0 ? [{ subjectId: french.id }] : []),
              ],
            },
            availability: {
              create: timeSlots
                .slice(i % 3, (i % 3) + 4)
                .map((ts) => ({ timeSlotId: ts.id })),
            },
          },
        },
      },
    });
  }

  // ── Level Compatibility Matrix ──
  // For math: 3eme+4eme can be merged (0.7), 2nde+1ere can be merged (0.6)
  const compatPairs = [
    { levelA: Level.COLLEGE_3EME, levelB: Level.COLLEGE_4EME, score: 0.7 },
    { levelA: Level.COLLEGE_4EME, levelB: Level.COLLEGE_3EME, score: 0.7 },
    { levelA: Level.LYCEE_2NDE, levelB: Level.LYCEE_1ERE, score: 0.6 },
    { levelA: Level.LYCEE_1ERE, levelB: Level.LYCEE_2NDE, score: 0.6 },
    { levelA: Level.LYCEE_1ERE, levelB: Level.LYCEE_TERMINALE, score: 0.5 },
    { levelA: Level.LYCEE_TERMINALE, levelB: Level.LYCEE_1ERE, score: 0.5 },
  ];

  for (const subject of [math, french, physics]) {
    for (const pair of compatPairs) {
      await prisma.levelCompatibility.create({
        data: { subjectId: subject.id, ...pair },
      });
    }
  }

  console.log("Seed complete.");
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

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 4. Feature-by-Feature Walkthrough

---

### Feature 1: Authentication & Role-Based Access

**What it is:** Users log in with email + password. The system knows if you are an Admin, Teacher, or Student, and shows you only the pages and actions you are allowed to see.

**Why it matters:** Security foundation. Without this, anyone could access admin functions, edit student data, or see confidential information. Every other feature depends on knowing who is logged in and what they can do.

**Data it touches:** `User` (role field), Supabase `auth.users` table (managed by Supabase).

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/lib/supabase/client.ts`
- `/Users/mmad/LEVEL-UP/src/lib/supabase/server.ts`
- `/Users/mmad/LEVEL-UP/src/server/auth/supabase.ts`
- `/Users/mmad/LEVEL-UP/src/server/auth/getUser.ts`
- `/Users/mmad/LEVEL-UP/src/server/auth/requireRole.ts`
- `/Users/mmad/LEVEL-UP/src/app/(auth)/login/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(auth)/register/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(auth)/layout.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/layout.tsx`
- `/Users/mmad/LEVEL-UP/src/components/shared/RoleGuard.tsx`
- `/Users/mmad/LEVEL-UP/src/app/api/webhooks/route.ts`
- `/Users/mmad/LEVEL-UP/src/middleware.ts`

**How to build it:**

1. **Create the browser Supabase client** (`src/lib/supabase/client.ts`). This uses `createBrowserClient` from `@supabase/ssr`. It reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This is the only client used in client components (`"use client"`).

2. **Create the server Supabase client** (`src/lib/supabase/server.ts`). This uses `createServerClient` from `@supabase/ssr` with Next.js cookies. It reads and writes auth cookies. Used in Server Components, Server Actions, and Route Handlers.

3. **Create the admin Supabase client** (`src/server/auth/supabase.ts`). This uses the `SUPABASE_SERVICE_ROLE_KEY` for admin operations (creating users on behalf of admin). Never import this file in client code.

4. **Build `getUser`** (`src/server/auth/getUser.ts`). This function calls `supabase.auth.getUser()` using the server client, then queries Prisma for the full `User` record (including role). Returns `null` if not authenticated.

```ts
// Key pattern — getUser.ts
import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

export async function getUser() {
  const supabase = await createServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { studentProfile: true, teacherProfile: true },
  });

  return user;
}
```

5. **Build `requireRole`** (`src/server/auth/requireRole.ts`). A helper that calls `getUser()`, checks the role, and throws a redirect to `/login` if unauthorized. Used at the top of Server Actions and in the dashboard layout.

```ts
// Key pattern — requireRole.ts
import { redirect } from "next/navigation";
import { getUser } from "./getUser";
import type { UserRole } from "@prisma/client";

export async function requireRole(...roles: UserRole[]) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/login");
  return user;
}
```

6. **Create Next.js middleware** (`src/middleware.ts`). This refreshes the Supabase session on every request (critical for cookie-based auth). It does NOT do role checking — that happens in layouts and Server Actions. The middleware just ensures the auth cookies stay fresh.

7. **Build the dashboard layout** (`src/app/(dashboard)/layout.tsx`). This is a Server Component that calls `getUser()`. If no user, redirect to `/login`. Based on `user.role`, it renders the correct sidebar links. This is the "gate" — if you get past this layout, you are authenticated.

8. **Build the login page** (`src/app/(auth)/login/page.tsx`). A client component with an email + password form. On submit, calls `supabase.auth.signInWithPassword()`. On success, redirect to `/(dashboard)/admin`, `/(dashboard)/teacher`, or `/(dashboard)/student` based on role. On error, show the error message.

9. **Build the registration flow**. For MVP, the admin creates accounts manually. The register page is admin-only. It calls a Server Action that: (a) uses the admin Supabase client to create the auth user, (b) creates the `User` row in Prisma with the correct role, (c) creates the `StudentProfile` or `TeacherProfile`.

10. **Build `RoleGuard`** component. A simple wrapper that checks the user's role client-side (from a React context or prop) and renders children only if the role matches. This is for UI hiding, not security — security is enforced server-side.

11. **Set up the webhook** (`src/app/api/webhooks/route.ts`). Supabase can send webhook events when users are created or deleted. This keeps your Prisma `User` table in sync if users are created through the Supabase dashboard.

**Testing checklist:**
- [ ] Unauthenticated user is redirected from `/admin` to `/login`
- [ ] Student cannot access `/admin/*` routes
- [ ] Teacher cannot access `/admin/*` routes
- [ ] Login with valid credentials succeeds and redirects correctly
- [ ] Login with invalid credentials shows error message
- [ ] Session persists across page refreshes
- [ ] Logout clears session and redirects to landing page

---

### Feature 2: Landing Page + Lead Capture

**What it is:** The public-facing marketing page. A single-page layout with Hero, Problem, Solution, Features, Results sections, and a "Réserver une séance" (Book a session) call-to-action form at the bottom. When a parent fills out the form, it creates a `LeadSubmission` record for the admin to follow up on.

**Why it matters:** This is how the tutoring center acquires new students. The page communicates the value proposition ("Réussir ses examens sans stress") and converts visitors into leads.

**Data it touches:** `LeadSubmission`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(landing)/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(landing)/layout.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/Hero.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/ProblemSection.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/SolutionSection.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/FeaturesSection.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/ResultsSection.tsx`
- `/Users/mmad/LEVEL-UP/src/components/landing/CTAForm.tsx`
- `/Users/mmad/LEVEL-UP/src/server/actions/leads.ts`
- `/Users/mmad/LEVEL-UP/src/types/schemas.ts` (LeadSubmission Zod schema)
- `/Users/mmad/LEVEL-UP/src/app/api/leads/route.ts`

**How to build it:**

1. **Create the landing layout** (`src/app/(landing)/layout.tsx`). No sidebar. Just a simple navbar with logo + "Connexion" button, and a footer. Use Server Component — no auth needed.

2. **Create the landing page** (`src/app/(landing)/page.tsx`). Import and stack the section components. Add SEO metadata:

```ts
// Key pattern — metadata
export const metadata = {
  title: "LEVEL UP | Réussir ses examens sans stress",
  description:
    "Centre de soutien scolaire qui combine accompagnement pédagogique et bien-être mental. Cours en petit groupe, suivi personnalisé, gestion du stress.",
  openGraph: {
    title: "LEVEL UP | Réussir ses examens sans stress",
    description: "Centre de soutien scolaire...",
    images: ["/images/og-image.png"],
  },
};
```

3. **Build each section component.** These are pure presentational Server Components. French copy throughout. Example structure for Hero:

```tsx
// Key pattern — Hero.tsx
export function Hero() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Réussir ses examens <span className="text-blue-600">sans stress</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          LEVEL UP combine soutien scolaire en petit groupe et accompagnement
          bien-être pour que chaque élève donne le meilleur de lui-même.
        </p>
        <a href="#reserver" className="mt-8 inline-block ...">
          Réserver une séance d&apos;essai
        </a>
      </div>
    </section>
  );
}
```

4. **Build the CTA form** (`src/components/landing/CTAForm.tsx`). This is a `"use client"` component. Fields: firstName, lastName, email, phone (optional), childLevel (select dropdown), subjects (multi-select checkboxes), message (textarea). On submit, call the `submitLead` Server Action.

5. **Define the Zod schema** in `src/types/schemas.ts`:

```ts
import { z } from "zod";

export const leadSubmissionSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  childLevel: z.string().optional(),
  subjects: z.array(z.string()).min(1, "Sélectionnez au moins une matière"),
  message: z.string().optional(),
});
```

6. **Build the Server Action** (`src/server/actions/leads.ts`). Validate with Zod, create `LeadSubmission` in Prisma, return success/error. No auth required — this is a public form.

7. **Optionally build a Route Handler** (`src/app/api/leads/route.ts`) as an alternative entry point (for external integrations or if you later add a mobile app).

**Testing checklist:**
- [ ] Landing page renders without errors (no hydration mismatch)
- [ ] CTA form validates required fields (empty submit shows errors)
- [ ] Valid form submission creates a `LeadSubmission` row
- [ ] Invalid email shows validation error
- [ ] Page loads in under 3 seconds (Lighthouse check)
- [ ] SEO metadata appears in page source
- [ ] All French copy is grammatically correct

---

### Feature 3: Student Management (Admin)

**What it is:** Admin can create, read, update, and delete student records. Each student has a level (e.g., 3eme, Terminale), one or more subjects, and availability slots. The admin can search and filter the student list.

**Why it matters:** Students are the core entity. You cannot assign sessions, track mood, or manage anything without a student database.

**Data it touches:** `User`, `StudentProfile`, `StudentSubject`, `StudentAvailability`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/students/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/students/StudentList.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/students/StudentForm.tsx`
- `/Users/mmad/LEVEL-UP/src/server/actions/students.ts`
- `/Users/mmad/LEVEL-UP/src/server/services/studentService.ts`

**How to build it:**

1. **Build the student service** (`src/server/services/studentService.ts`). Functions: `listStudents(filters)`, `getStudentById(id)`, `createStudent(data)`, `updateStudent(id, data)`, `deleteStudent(id)`. Each function uses Prisma. `createStudent` must also create the Supabase auth user (via admin client) and the `User` + `StudentProfile` rows in a transaction.

2. **Build Server Actions** (`src/server/actions/students.ts`). Each action: validate input with Zod, call `requireRole("ADMIN")`, call the service, return the result. Use `revalidatePath("/admin/students")` after mutations.

```ts
// Key pattern — server action
"use server";
import { requireRole } from "@/server/auth/requireRole";
import { studentService } from "@/server/services/studentService";
import { createStudentSchema } from "@/types/schemas";
import { revalidatePath } from "next/cache";

export async function createStudentAction(formData: FormData) {
  await requireRole("ADMIN");

  const raw = Object.fromEntries(formData);
  const parsed = createStudentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await studentService.createStudent(parsed.data);
  revalidatePath("/admin/students");
  return { success: true };
}
```

3. **Build the StudentList component** (`src/components/features/students/StudentList.tsx`). A `"use client"` component. Renders a `<Table>` from shadcn with columns: name, email, level, subjects, actions (edit/delete). Add a search input that filters client-side (for MVP, server-side search can come later). Add a "Ajouter un élève" button that opens a dialog.

4. **Build the StudentForm component** (`src/components/features/students/StudentForm.tsx`). A form with fields: firstName, lastName, email, phone, level (select), subjects (multi-checkbox), parentName, parentPhone, parentEmail. Uses shadcn `Form` component. On submit, calls the Server Action.

5. **Build the page** (`src/app/(dashboard)/admin/students/page.tsx`). A Server Component that fetches all students via the service and passes them to `StudentList`.

**Testing checklist:**
- [ ] Admin can create a student with all required fields
- [ ] Validation errors show when fields are missing
- [ ] Student appears in the list after creation
- [ ] Admin can edit a student's level
- [ ] Admin can delete a student (with confirmation dialog)
- [ ] Non-admin user cannot access this page
- [ ] Search filters the list correctly

---

### Feature 4: Teacher Management (Admin)

**What it is:** Admin manages teachers: name, email, subjects they teach, and their weekly availability (which time slots they are free).

**Why it matters:** The auto-assignment algorithm needs to know which teachers are available and what they can teach. Without this data, scheduling is impossible.

**Data it touches:** `User`, `TeacherProfile`, `TeacherSubject`, `TeacherAvailability`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/teachers/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/teachers/TeacherForm.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/teachers/TeacherAvailabilityEditor.tsx`
- `/Users/mmad/LEVEL-UP/src/server/actions/teachers.ts` (add to Server Actions)
- `/Users/mmad/LEVEL-UP/src/server/services/teacherService.ts`

**How to build it:**

1. **Build the teacher service** similar to student service. `createTeacher` creates Supabase auth user + `User` + `TeacherProfile` in a transaction.

2. **Build the TeacherAvailabilityEditor** component. This is the interesting one. It is a grid where rows are days of the week and columns are time slots. Each cell is a checkbox. When the admin toggles a cell, it creates or deletes a `TeacherAvailability` record.

```tsx
// Key pattern — availability grid (conceptual)
// Rows: MONDAY, TUESDAY, ...
// Columns: time slots (fetched from DB)
// Cell: checkbox bound to TeacherAvailability existence
<div className="grid grid-cols-[auto_repeat(var(--slot-count),1fr)]">
  {days.map((day) => (
    <div key={day} className="contents">
      <span className="font-medium">{dayLabels[day]}</span>
      {slotsForDay(day).map((slot) => (
        <Checkbox
          key={slot.id}
          checked={isAvailable(teacher.id, slot.id)}
          onCheckedChange={(checked) =>
            toggleAvailability(teacher.id, slot.id, checked)
          }
        />
      ))}
    </div>
  ))}
</div>
```

3. **Build Server Actions** for teachers: `createTeacherAction`, `updateTeacherAction`, `deleteTeacherAction`, `toggleTeacherAvailabilityAction`.

4. **Build the page** — same pattern as students.

**Testing checklist:**
- [ ] Admin can create a teacher with subjects
- [ ] Availability grid renders correctly for all time slots
- [ ] Toggling availability persists to database
- [ ] Teacher can teach only their assigned subjects
- [ ] Deleting a teacher handles cascade (availability records removed)

---

### Feature 5: Rooms & Time Slots (Admin)

**What it is:** Admin defines the physical rooms (with capacity) and the weekly time slot grid (e.g., Monday 16:00-17:30). These are the "containers" that sessions fit into.

**Why it matters:** Rooms constrain how many sessions can run simultaneously (a room can only host one session at a time). Time slots define the weekly rhythm. The assignment algorithm needs both.

**Data it touches:** `Room`, `TimeSlot`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/rooms/page.tsx`
- `/Users/mmad/LEVEL-UP/src/server/actions/rooms.ts` (add Room and TimeSlot actions)

**How to build it:**

1. **Create a tabbed page** with two tabs: "Salles" and "Créneaux".

2. **Rooms tab**: Simple table with name + capacity + edit/delete. Small form dialog to add/edit.

3. **Time slots tab**: Table showing day, start time, end time, label. Form with day select, time pickers, label field.

4. **Server Actions**: `createRoom`, `updateRoom`, `createTimeSlot`, `updateTimeSlot`. All require ADMIN role.

5. **Important constraint**: You cannot delete a time slot that has existing sessions or availability records. The delete action must check for references first and return a clear error.

**Testing checklist:**
- [ ] Admin can create a room with name and capacity
- [ ] Admin can create a time slot with day, start, end
- [ ] Duplicate time slot (same day+start+end) is rejected
- [ ] Cannot delete a room that has sessions
- [ ] Capacity is enforced as a positive integer

---

### Feature 6: Session Management & Weekly Calendar

**What it is:** Sessions are the actual tutoring events. A `SessionTemplate` defines a recurring pattern (e.g., "Math in Room A, Monday 16:00-17:30"). From templates, concrete `Session` instances are generated for specific dates. The admin manages sessions via a weekly calendar view. Teachers and students see read-only views of their sessions.

**Why it matters:** Sessions are the product. Everything else exists to create, fill, and track sessions.

**Data it touches:** `SessionTemplate`, `Session`, `Room`, `TimeSlot`, `TeacherProfile`, `Subject`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/sessions/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/sessions/SessionCalendar.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/sessions/SessionForm.tsx`
- `/Users/mmad/LEVEL-UP/src/server/services/sessionService.ts`
- `/Users/mmad/LEVEL-UP/src/server/actions/sessions.ts`

**How to build it:**

1. **Build the session service**. Key functions:
   - `generateWeekSessions(weekStartDate)` — for each active `SessionTemplate`, create a `Session` row for the given week if one does not already exist. This is idempotent.
   - `listSessionsByWeek(weekStartDate, filters)` — return all sessions for a given week, optionally filtered by teacher or student.
   - `createSession(data)` — manually create a one-off session.
   - `updateSession(id, data)` — change teacher, room, status, etc.
   - `cancelSession(id)` — set status to CANCELLED, notify enrolled students.

2. **Build the SessionCalendar component**. For MVP, build a custom grid rather than pulling in FullCalendar (large dependency). Structure:

```
         Mon         Tue         Wed         Thu         Sat
16:00  [Math/A]     [Fr/B]
17:30  [Phys/A]     [Math/B]
14:00                            [Math/A]
...
```

Each cell shows: subject color bar, teacher initial, enrolled count / capacity. Clicking a cell opens the SessionForm dialog.

3. **Build the SessionForm** — select subject, teacher (filtered to those available for the time slot and who teach the subject), room, date, status. Validate that the teacher is available and the room is free.

4. **Week navigation** — add "Previous week" / "Next week" buttons. Use URL search params (`?week=2026-04-13`) so the view is shareable and bookmarkable.

5. **Teacher and student views** — reuse `SessionCalendar` with a read-only flag and filtered data.

**Testing checklist:**
- [ ] `generateWeekSessions` creates sessions from templates
- [ ] `generateWeekSessions` is idempotent (running twice does not duplicate)
- [ ] Calendar renders sessions in correct grid positions
- [ ] Cannot create a session if room is already booked at that time
- [ ] Cannot assign a teacher who is not available for that slot
- [ ] Cancelling a session changes its status and notifies students
- [ ] Week navigation works correctly

---

### Feature 7: Intelligent Auto-Assignment (The "Brain")

**What it is:** The core differentiator. Given a pool of students (each needing certain subjects), a set of available teachers and rooms, and a compatibility matrix that defines which levels can be merged together, the algorithm proposes a draft schedule that maximizes fill rate (students per session) while respecting all constraints.

"Mutualization" means: if a 3eme student and a 4eme student both need math, and the compatibility score is 0.7 (high enough), they can be placed in the same session. This reduces the number of sessions needed and fills rooms more efficiently.

**Why it matters:** This is the business logic that makes LEVEL UP more than a simple booking tool. Manual scheduling for 50+ students across multiple subjects and levels is a nightmare. Automated, optimized scheduling is the key value.

**Data it touches:** `StudentProfile`, `StudentSubject`, `StudentAvailability`, `TeacherProfile`, `TeacherSubject`, `TeacherAvailability`, `Room`, `TimeSlot`, `Session`, `Enrollment`, `LevelCompatibility`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/server/domain/scheduling/assignment.ts`
- `/Users/mmad/LEVEL-UP/src/server/domain/scheduling/conflicts.ts`
- `/Users/mmad/LEVEL-UP/src/server/domain/scheduling/compatibility.ts`
- `/Users/mmad/LEVEL-UP/src/server/services/assignmentService.ts`
- `/Users/mmad/LEVEL-UP/src/server/actions/assignments.ts`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/assignments/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/assignments/AssignmentDraft.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/assignments/CompatibilityMatrix.tsx`
- `/Users/mmad/LEVEL-UP/src/app/api/assignments/route.ts`

**How to build it:**

1. **Define the pure domain types** (`src/types/domain.ts`):

```ts
export type StudentDemand = {
  studentId: string;
  level: Level;
  subjectIds: string[];
  availableSlotIds: string[];
};

export type TeacherWithAvailability = {
  teacherId: string;
  subjectIds: string[];
  availableSlotIds: string[];
};

export type ProposedSession = {
  subjectId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  studentIds: string[];
  levels: Level[];
  fillRate: number; // studentIds.length / maxCapacity
};
```

2. **Build the compatibility checker** (`src/server/domain/scheduling/compatibility.ts`). A pure function that takes the `LevelCompatibility[]` matrix and two levels, and returns a score. Also a function `canMergeLevels(levelA, levelB, subjectId, matrix, threshold)` that returns boolean.

3. **Build the conflict detector** (`src/server/domain/scheduling/conflicts.ts`). Pure function: given a student ID and a list of proposed sessions, check if the student is already assigned to a session at the same time slot.

4. **Build the assignment algorithm** (`src/server/domain/scheduling/assignment.ts`). See Section 5 for the deep dive. The key function:

```ts
export function proposeAssignments(input: AssignmentInput): AssignmentOutput
```

5. **Build the assignment service** (`src/server/services/assignmentService.ts`). This is the orchestrator:
   - `runAssignment()`: loads data from DB, calls `proposeAssignments`, saves draft sessions with status `DRAFT`.
   - `approveDraft(sessionIds)`: changes draft sessions to `CONFIRMED`, creates `Enrollment` records, sends notifications.
   - `rejectDraft(sessionIds)`: deletes draft sessions.

6. **Build the admin UI** (`src/app/(dashboard)/admin/assignments/page.tsx`):
   - A "Lancer l'affectation" (Run Assignment) button
   - After running, display the draft: proposed sessions as cards showing subject, teacher, room, time slot, student list, fill rate
   - Each card has "Approve" and "Reject" buttons
   - A "Tout approuver" (Approve All) button
   - Show unassigned students with reasons

7. **Build the CompatibilityMatrix editor** — an admin tool to adjust compatibility scores. Grid of levels x levels per subject, each cell is a 0.0-1.0 slider or number input.

**Testing checklist:**
- [ ] Empty input returns empty output with no errors
- [ ] Single student + single teacher + single room produces one session
- [ ] Two students with compatible levels are merged into one session
- [ ] Two students with incompatible levels get separate sessions
- [ ] Teacher constraint: only assigned to subjects they teach
- [ ] Room constraint: no double-booking
- [ ] Student constraint: no time conflicts
- [ ] Capacity constraint: max 10 students per session
- [ ] Fill rate is calculated correctly
- [ ] Draft approval creates enrollments
- [ ] Draft rejection deletes draft sessions

---

### Feature 8: Enrollment & Conflict Detection

**What it is:** When sessions are approved (or students are manually enrolled), `Enrollment` records are created linking students to sessions. The system validates that no conflicts exist: a student cannot be in two sessions at the same time, a session cannot exceed its capacity, and a student cannot be enrolled twice in the same session.

**Why it matters:** Data integrity. Without these checks, you could accidentally double-book a student or overfill a room.

**Data it touches:** `Enrollment`, `Session`, `StudentProfile`.

**Files to create:**
- Enrollment logic lives in `/Users/mmad/LEVEL-UP/src/server/services/sessionService.ts` (add `enrollStudent`, `unenrollStudent` methods)
- Conflict checks in `/Users/mmad/LEVEL-UP/src/server/domain/scheduling/conflicts.ts`

**How to build it:**

1. **Add `enrollStudent(sessionId, studentId)` to session service.** Before creating the enrollment:
   - Check session capacity: `currentEnrollments.length < session.maxStudents`
   - Check duplicate: no existing enrollment with same session+student
   - Check time conflict: no active enrollment for this student in a session with the same time slot and date

```ts
// Key pattern — conflict check
export function hasTimeConflict(
  studentEnrollments: Array<{ session: { timeSlotId: string; date: Date } }>,
  targetTimeSlotId: string,
  targetDate: Date
): boolean {
  return studentEnrollments.some(
    (e) =>
      e.session.timeSlotId === targetTimeSlotId &&
      e.session.date.getTime() === targetDate.getTime()
  );
}
```

2. **Use database constraints as a safety net.** The `@@unique([sessionId, studentId])` on `Enrollment` prevents duplicates even if application code has a bug. This is defense in depth.

3. **Return clear error messages.** If enrollment fails, the error should say exactly why: "Cet élève a déjà un cours à ce créneau" or "La séance est complète (10/10)".

**Testing checklist:**
- [ ] Cannot enroll when session is full
- [ ] Cannot enroll same student twice in same session
- [ ] Cannot enroll student in overlapping time slot
- [ ] Successful enrollment increments the session count
- [ ] Unenrollment decrements the session count
- [ ] Database unique constraint catches race conditions

---

### Feature 9: Chat (Student <-> Admin)

**What it is:** Each student has a single conversation thread with the admin team. The student can send messages from their dashboard; the admin sees all conversations in an inbox view. Messages appear in real-time using Supabase Realtime subscriptions.

**Why it matters:** Students (and their parents) need a direct communication channel with the tutoring center — for schedule questions, methodology advice, or just reassurance before exams.

**Data it touches:** `Conversation`, `Message`, `User`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/student/chat/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/chat/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/chat/ChatBubble.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/chat/ConversationList.tsx`
- `/Users/mmad/LEVEL-UP/src/server/domain/messaging/chat.ts`
- `/Users/mmad/LEVEL-UP/src/server/services/chatService.ts` (add this to the list)
- `/Users/mmad/LEVEL-UP/src/server/actions/chat.ts` (add this)

**How to build it:**

1. **Build the chat service.** Functions: `getOrCreateConversation(studentId)`, `sendMessage(conversationId, senderId, content)`, `listConversations()` (admin), `markAsRead(conversationId, userId)`.

2. **Build the student chat page.** On load, call `getOrCreateConversation` (creates the conversation if first time). Display messages in a scrollable list. Input at the bottom with send button.

3. **Set up Supabase Realtime.** In the client component, subscribe to changes on the `Message` table filtered by `conversationId`:

```ts
// Key pattern — realtime subscription
const channel = supabase
  .channel(`chat:${conversationId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "Message",
      filter: `conversationId=eq.${conversationId}`,
    },
    (payload) => {
      setMessages((prev) => [...prev, payload.new as Message]);
    }
  )
  .subscribe();

// Cleanup on unmount
return () => { supabase.removeChannel(channel); };
```

**Important:** For Supabase Realtime to work with Prisma-managed tables, you need to enable replication on the `Message` table in Supabase Dashboard > Database > Replication.

4. **Build the admin chat page.** Left panel: `ConversationList` showing student name + last message preview + unread badge. Right panel: selected conversation messages. Real-time updates for all conversations.

5. **Build the ChatBubble component.** Shows sender name, message content, timestamp. Different alignment and color for sent vs received.

6. **Unread tracking:** When messages are fetched, mark them as read for the current user. The unread count is computed as messages where `isRead = false` and `senderId != currentUserId`.

**Testing checklist:**
- [ ] Student can send a message and it appears immediately
- [ ] Admin sees new message in real-time without page refresh
- [ ] Conversation is auto-created on first student message
- [ ] Unread count updates correctly
- [ ] Messages are in chronological order
- [ ] Empty conversation shows a friendly prompt
- [ ] Only the student's own conversation is accessible (no cross-student access)

---

### Feature 10: Notifications

**What it is:** In-app notification system. A bell icon in the navbar shows the unread count. Clicking it opens a dropdown with recent notifications. Notifications are triggered by system events: new session assigned, session cancelled/moved, new chat message, exam date approaching.

**Why it matters:** Keeps users informed without requiring them to constantly check every page. Critical for session changes — a student must know if their session was cancelled.

**Data it touches:** `Notification`, `User`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/components/shared/NotificationBell.tsx`
- `/Users/mmad/LEVEL-UP/src/server/services/notificationService.ts`
- `/Users/mmad/LEVEL-UP/src/app/api/notifications/route.ts`

**How to build it:**

1. **Build the notification service.** Functions:
   - `createNotification(userId, type, title, body, metadata?)` — inserts a row
   - `getUserNotifications(userId, limit?)` — returns recent notifications
   - `markAsRead(notificationId)` — sets `isRead = true`
   - `getUnreadCount(userId)` — count query
   - `notifySessionAssigned(sessionId, studentIds)` — batch creates notifications
   - `notifySessionCancelled(sessionId)` — notifies all enrolled students

2. **Wire notification triggers into existing services.** When `sessionService.cancelSession()` runs, call `notificationService.notifySessionCancelled()`. When `assignmentService.approveDraft()` runs, call `notificationService.notifySessionAssigned()`. When `chatService.sendMessage()` runs, create a notification for the recipient.

3. **Build the NotificationBell component.** A `"use client"` component. Polls the `/api/notifications` route every 30 seconds (or use Supabase Realtime on the `Notification` table for instant updates). Shows a red badge with count. Click opens a `DropdownMenu` from shadcn with notification items.

4. **Build the API route** (`/api/notifications/route.ts`). GET: returns notifications for the authenticated user. PATCH: marks a notification as read.

**Testing checklist:**
- [ ] Notification is created when session is assigned
- [ ] Notification is created when session is cancelled
- [ ] Notification is created on new chat message
- [ ] Unread count reflects actual unread notifications
- [ ] Clicking a notification marks it as read
- [ ] Bell badge disappears when all are read
- [ ] Only the user's own notifications are returned

---

### Feature 11: Stress & Methodology Hub (Differentiator)

**What it is:** A library of micro-lessons, exercises, protocols, and templates focused on: stress management, study methodology, time management, exam preparation, and motivation. Includes a guided breathing exercise (animated timer) and a pre-exam protocol that activates based on the student's upcoming exam dates.

**Why it matters:** This is what makes LEVEL UP different from other tutoring centers. The tagline is "Réussir ses examens sans stress" — this feature delivers on the "sans stress" promise.

**Data it touches:** `ContentItem`, `ContentCompletion`, `ExamDate`, `StudentProfile`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/student/methodology/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/content/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/wellbeing/BreathingExercise.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/wellbeing/StressHeatmap.tsx`
- `/Users/mmad/LEVEL-UP/src/server/domain/wellbeing/examProtocol.ts`
- `/Users/mmad/LEVEL-UP/src/server/services/contentService.ts` (add)
- `/Users/mmad/LEVEL-UP/src/server/actions/content.ts` (add)

**How to build it:**

1. **Build the admin content editor** (`/admin/content/page.tsx`). Admin can create `ContentItem` records. Each has: title, description, type (micro_lesson, exercise, protocol, template), category (stress_management, methodology, etc.), content (a JSON blob that can hold markdown text, video URL, step arrays, or duration). Sort order determines display position.

2. **Build the student methodology page** (`/student/methodology/page.tsx`). Display content grouped by category. Each item shows a card with title, description, type badge. Clicking opens the content. Completed items show a checkmark. Progress bar per category.

3. **Build the BreathingExercise component.** A timed, animated component:
   - Circle that expands and contracts
   - Phases: Inspirez (4s) → Retenez (4s) → Expirez (6s) → Pause (2s)
   - Cycle count: user selects 3, 5, or 10 cycles
   - Uses CSS animations + `useEffect` for timing

```tsx
// Key pattern — breathing exercise state
const PHASES = [
  { label: "Inspirez", duration: 4000, scale: 1.5 },
  { label: "Retenez", duration: 4000, scale: 1.5 },
  { label: "Expirez", duration: 6000, scale: 1.0 },
  { label: "Pause", duration: 2000, scale: 1.0 },
] as const;
```

4. **Build the exam protocol** (`src/server/domain/wellbeing/examProtocol.ts`). Pure function that takes a student's exam dates and current date, and returns recommended actions:
   - 4 weeks before: "Commencez les fiches de révision"
   - 2 weeks before: "Faites des annales chronométrées"
   - 1 week before: "Révisez vos fiches, pas de nouvelles matières"
   - 3 days before: "Détente, exercice physique, sommeil"
   - Day of: "Respiration, confiance, vous êtes prêt(e)"

5. **Track completion.** When a student finishes a content item, create a `ContentCompletion` record. The student page shows their progress.

**Testing checklist:**
- [ ] Admin can create content items of each type
- [ ] Student sees content grouped by category
- [ ] Completing a content item records the completion
- [ ] Breathing exercise cycles through all phases correctly
- [ ] Exam protocol returns correct recommendations based on date distance
- [ ] Content marked as unpublished is not visible to students

---

### Feature 12: Mood Check-ins

**What it is:** Students rate their mood on a 1-5 scale before and after sessions (and optionally daily). This data is stored and aggregated for admin visibility. The admin dashboard shows a heatmap of mood trends to identify students who might need extra support.

**Why it matters:** Early detection of struggling students. A declining mood trend is a signal to intervene before the student drops out or burns out.

**Data it touches:** `MoodCheckIn`, `StudentProfile`, `Session`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/student/mood/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/wellbeing/MoodSlider.tsx`
- `/Users/mmad/LEVEL-UP/src/server/domain/wellbeing/moodAggregation.ts`
- `/Users/mmad/LEVEL-UP/src/server/actions/mood.ts`

**How to build it:**

1. **Build the MoodSlider component.** A `"use client"` component with a shadcn `Slider` (1-5) and an optional text note. Each value has a face icon (from sad to happy) and a French label: "Très mal", "Mal", "Neutre", "Bien", "Très bien". Submit calls a Server Action.

2. **Build the mood Server Action** (`src/server/actions/mood.ts`). Validates score is 1-5, creates `MoodCheckIn` record. For pre/post session moods, the `sessionId` is required.

3. **Build mood aggregation** (`src/server/domain/wellbeing/moodAggregation.ts`). Pure functions:
   - `calculateTrend(checkIns: MoodCheckIn[])` — returns "improving", "stable", "declining" based on simple moving average
   - `weeklyAverage(checkIns: MoodCheckIn[], weekStart: Date)` — average score for a week
   - `sessionDelta(preScore: number, postScore: number)` — how much mood changed during a session

4. **Student mood page** — shows a personal timeline of their mood check-ins. Simple line chart (Recharts).

5. **Admin sees mood data** in the StressHeatmap component on the dashboard (Feature 13).

**Testing checklist:**
- [ ] Student can submit a mood rating (1-5)
- [ ] Score outside 1-5 is rejected
- [ ] Pre-session mood is linked to session
- [ ] Trend calculation: [5, 4, 3, 2] = "declining"
- [ ] Trend calculation: [2, 3, 4, 5] = "improving"
- [ ] Mood history displays in correct chronological order

---

### Feature 13: Admin Dashboard

**What it is:** The admin's home page with at-a-glance metrics: total students, total teachers, fill rate gauge, enrollment by subject/level bar chart, and a stress heatmap showing students with declining mood trends.

**Why it matters:** The admin needs to make decisions quickly. A dashboard reduces the time from "I wonder how things are going" to "I see exactly where to act."

**Data it touches:** `Session`, `Enrollment`, `StudentProfile`, `MoodCheckIn`, `User`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/admin/page.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/dashboard/StatsCards.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/dashboard/FillRateGauge.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/dashboard/EnrollmentChart.tsx`
- `/Users/mmad/LEVEL-UP/src/components/features/wellbeing/StressHeatmap.tsx`
- `/Users/mmad/LEVEL-UP/src/server/domain/analytics/fillRate.ts`

**How to build it:**

1. **Build fillRate domain logic** (`src/server/domain/analytics/fillRate.ts`). Pure function:

```ts
export function computeFillRate(
  sessions: Array<{ maxStudents: number; enrollmentCount: number }>
): number {
  if (sessions.length === 0) return 0;
  const totalCapacity = sessions.reduce((sum, s) => sum + s.maxStudents, 0);
  const totalEnrolled = sessions.reduce((sum, s) => sum + s.enrollmentCount, 0);
  return totalCapacity > 0 ? totalEnrolled / totalCapacity : 0;
}
```

2. **Build StatsCards** — four cards: "Élèves actifs" (count), "Professeurs" (count), "Séances cette semaine" (count), "Taux de remplissage" (percentage). Use Prisma counts in the page Server Component, pass as props.

3. **Build FillRateGauge** — Recharts `RadialBarChart` showing the fill rate as a percentage. Green > 80%, yellow 50-80%, red < 50%.

4. **Build EnrollmentChart** — Recharts `BarChart` with x-axis = subjects, stacked by level. Data computed server-side via Prisma groupBy.

5. **Build StressHeatmap** — a grid showing students (rows) and weeks (columns). Each cell is colored by average mood score (green = 5, red = 1). Highlight students with declining trends.

6. **Wire it all up in the admin page.** This is a Server Component that makes several Prisma queries, computes the stats, and renders the components.

**Testing checklist:**
- [ ] Fill rate is 0% when no sessions exist
- [ ] Fill rate is 100% when all sessions are full
- [ ] Stats cards show correct counts
- [ ] Bar chart reflects actual enrollment data
- [ ] Stress heatmap highlights declining students
- [ ] Dashboard loads in under 2 seconds

---

### Feature 14: Teacher Dashboard

**What it is:** The teacher's home page showing their weekly schedule, the students enrolled in each of their sessions, and an option to attach a methodology card to an upcoming session.

**Why it matters:** Teachers need to prepare for their sessions. Knowing who is in each group and at what level lets them plan appropriate exercises.

**Data it touches:** `Session`, `Enrollment`, `StudentProfile`, `TeacherProfile`, `ContentItem`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/teacher/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/teacher/schedule/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/teacher/students/page.tsx`

**How to build it:**

1. **Teacher home page** — summary cards: sessions this week, total students, next session (with countdown). Reuse `StatsCards` with teacher-specific data.

2. **Schedule page** — reuse `SessionCalendar` component, filtered by `teacherId`. Read-only. Each session cell is clickable, expanding to show the enrolled student list with their levels.

3. **Students page** — table showing all students enrolled in any of this teacher's sessions. Columns: name, level, subject, session day/time, mood trend (if available).

4. **Methodology card attachment** — on the schedule page, each session has a "Ajouter une fiche" button. Opens a dialog listing available `ContentItem` records. Selected item is linked to the session via a `notes` JSON field (for MVP — a proper join table can come later).

**Testing checklist:**
- [ ] Teacher sees only their own sessions
- [ ] Student list per session is accurate
- [ ] Teacher cannot modify session details (read-only)
- [ ] Next session countdown is correct

---

### Feature 15: Student Dashboard

**What it is:** The student's home page showing their weekly schedule, upcoming sessions, notifications, a quick mood check-in widget, and shortcuts to the methodology hub and chat.

**Why it matters:** A student should be able to open the app and immediately see: "What do I have this week? How am I feeling? What resources can help me?"

**Data it touches:** `Session`, `Enrollment`, `Notification`, `MoodCheckIn`, `ContentCompletion`, `StudentProfile`.

**Files to create:**
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/student/page.tsx`
- `/Users/mmad/LEVEL-UP/src/app/(dashboard)/student/schedule/page.tsx`

**How to build it:**

1. **Student home page** — a grid layout:
   - Top left: "Prochaines séances" — next 3 sessions with subject, teacher, room, date/time
   - Top right: "Comment tu te sens ?" — `MoodSlider` for daily check-in
   - Middle: "Notifications" — last 5 unread notifications
   - Bottom left: "Ma progression" — methodology completion progress bar
   - Bottom right: Quick links — "Chat avec l'administration", "Hub méthodologie", "Exercice de respiration"

2. **Schedule page** — reuse `SessionCalendar` filtered by student enrollments. Read-only. Color-coded by subject.

3. **Exam countdown** — if the student has `ExamDate` records, show a card: "Bac de Maths dans 12 jours" with the exam protocol recommendation for that time window.

**Testing checklist:**
- [ ] Student sees only their own sessions
- [ ] Mood widget submits successfully
- [ ] Upcoming sessions are sorted by date
- [ ] Exam countdown is accurate
- [ ] Quick links navigate to correct pages

---

## 5. The Assignment Algorithm — Deep Dive

This is the most complex piece of logic in the application. It lives in `/Users/mmad/LEVEL-UP/src/server/domain/scheduling/assignment.ts` and is a **pure function** — no database calls, no side effects. This makes it easy to test and reason about.

### Type Signatures

```ts
// Input types
type StudentDemand = {
  studentId: string;
  level: Level;
  subjectIds: string[];           // Subjects the student needs
  availableSlotIds: string[];     // Time slots the student is free
};

type TeacherWithAvailability = {
  teacherId: string;
  subjectIds: string[];           // Subjects the teacher can teach
  availableSlotIds: string[];     // Time slots the teacher is free
};

type AssignmentInput = {
  students: StudentDemand[];
  teachers: TeacherWithAvailability[];
  rooms: Array<{ roomId: string; capacity: number }>;
  timeSlots: Array<{ timeSlotId: string }>;
  compatibilityMatrix: Array<{
    subjectId: string;
    levelA: Level;
    levelB: Level;
    score: number;
  }>;
  existingSessions: Array<{
    teacherId: string;
    roomId: string;
    timeSlotId: string;
    studentIds: string[];
  }>;
  config: {
    maxStudentsPerSession: number;   // default 10
    compatibilityThreshold: number;  // default 0.5
  };
};

// Output types
type ProposedSession = {
  subjectId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  studentIds: string[];
  levels: Level[];
  fillRate: number;
};

type AssignmentOutput = {
  proposedSessions: ProposedSession[];
  unassignedStudents: Array<{
    studentId: string;
    subjectId: string;
    reason: string;
  }>;
  score: {
    fillRate: number;         // Average fill rate across sessions
    mergedCount: number;      // Sessions with mixed levels
    unassignedCount: number;  // Student-subject pairs not placed
    totalSessions: number;
  };
};
```

### Pseudocode

```
function proposeAssignments(input: AssignmentInput): AssignmentOutput:
  proposedSessions = []
  unassigned = []

  // STEP 1: Decompose into (student, subject) demand pairs
  demands = []
  for each student in input.students:
    for each subjectId in student.subjectIds:
      demands.push({ studentId, subjectId, level, availableSlotIds })

  // STEP 2: Group demands by subject
  demandsBySubject = groupBy(demands, "subjectId")

  // STEP 3: For each subject, cluster students by compatible levels
  for each (subjectId, subjectDemands) in demandsBySubject:

    // Sort by level to keep similar levels adjacent
    sortedDemands = sortBy(subjectDemands, "level")

    // Build clusters of compatible students
    clusters = []
    for each demand in sortedDemands:
      placed = false
      for each cluster in clusters:
        if cluster.length < config.maxStudentsPerSession:
          if allCompatible(demand.level, cluster.levels, subjectId, matrix, threshold):
            if hasOverlappingSlot(demand.availableSlotIds, cluster.commonSlotIds):
              cluster.add(demand)
              cluster.commonSlotIds = intersect(cluster.commonSlotIds, demand.availableSlotIds)
              placed = true
              break
      if not placed:
        clusters.push(newCluster(demand))

    // STEP 4: For each cluster, find a teacher + room + time slot
    for each cluster in clusters:
      // Find available teachers for this subject and at least one common slot
      candidateTeachers = input.teachers.filter(t =>
        t.subjectIds.includes(subjectId) &&
        hasOverlap(t.availableSlotIds, cluster.commonSlotIds)
      )

      if candidateTeachers.length === 0:
        for each demand in cluster:
          unassigned.push({ studentId: demand.studentId, subjectId, reason: "Aucun professeur disponible" })
        continue

      // Pick the teacher with the most availability overlap (greedy)
      bestTeacher = maxBy(candidateTeachers, t =>
        intersect(t.availableSlotIds, cluster.commonSlotIds).length
      )

      // Find a time slot that works for teacher + cluster + has a free room
      possibleSlots = intersect(bestTeacher.availableSlotIds, cluster.commonSlotIds)

      assigned = false
      for each slotId in possibleSlots:
        // Check: teacher not already assigned to this slot in proposed/existing sessions
        if teacherBusyAt(bestTeacher.teacherId, slotId, proposedSessions, existingSessions):
          continue

        // Find a free room at this slot
        freeRoom = input.rooms.find(r =>
          !roomBusyAt(r.roomId, slotId, proposedSessions, existingSessions)
        )

        if freeRoom:
          // Check: no student in this cluster already has a session at this slot
          conflictFreeStudents = cluster.students.filter(d =>
            !studentBusyAt(d.studentId, slotId, proposedSessions, existingSessions)
          )

          if conflictFreeStudents.length > 0:
            proposedSessions.push({
              subjectId,
              teacherId: bestTeacher.teacherId,
              roomId: freeRoom.roomId,
              timeSlotId: slotId,
              studentIds: conflictFreeStudents.map(d => d.studentId),
              levels: unique(conflictFreeStudents.map(d => d.level)),
              fillRate: conflictFreeStudents.length / freeRoom.capacity,
            })

            // Mark students who had conflicts as unassigned
            conflictStudents = cluster.students.filter(d =>
              !conflictFreeStudents.includes(d)
            )
            for each d in conflictStudents:
              unassigned.push({ studentId: d.studentId, subjectId, reason: "Conflit de créneau" })

            assigned = true
            break

      if not assigned:
        for each demand in cluster:
          unassigned.push({ studentId: demand.studentId, subjectId, reason: "Aucun créneau/salle disponible" })

  // STEP 5: Compute score
  score = {
    fillRate: average(proposedSessions.map(s => s.fillRate)),
    mergedCount: proposedSessions.filter(s => s.levels.length > 1).length,
    unassignedCount: unassigned.length,
    totalSessions: proposedSessions.length,
  }

  return { proposedSessions, unassignedStudents: unassigned, score }
```

### 10 Unit Test Cases

Write these in `/Users/mmad/LEVEL-UP/src/tests/unit/scheduling/assignment.test.ts`:

1. **Empty input** — no students, no teachers. Returns empty sessions, empty unassigned, score = 0.

2. **Single student, single teacher, single room, single slot** — produces exactly one session with fill rate 1/10.

3. **Two compatible students (3eme + 4eme, score 0.7)** — merged into one session.

4. **Two incompatible students (Primaire + Terminale, score 0)** — two separate sessions (or one unassigned if only one slot/room).

5. **Ten students, same subject, same level, compatible** — fills one session to 10/10 (100% fill rate).

6. **Eleven students, same slot, one room** — 10 in one session, 1 in another or unassigned.

7. **Teacher teaches Math but not French** — student needing French is unassigned.

8. **Student and teacher have no overlapping slots** — student is unassigned with reason "Aucun professeur disponible."

9. **Two rooms, two slots, three subjects** — algorithm uses both rooms and slots to maximize assignments.

10. **Existing sessions block resources** — if a teacher already has a session at Monday 16:00, the algorithm does not double-book them.

---

## 6. Development Roadmap (Week-by-Week)

### Week 1: Foundation (Days 1-5)

| Day | Tasks |
|-----|-------|
| 1 | Project setup (Section 1 commands). Prisma schema. Run first migration. Seed database. Verify with `prisma studio`. |
| 2 | Supabase auth setup. Browser + server clients. `getUser` + `requireRole` helpers. Middleware for session refresh. |
| 3 | Login page. Dashboard layout with sidebar. Role-based redirect. Basic root layout with providers (QueryProvider, SupabaseProvider). |
| 4 | Landing page: Hero, Problem, Solution, Features, Results sections. Static content, responsive design. |
| 5 | CTA form with Zod validation + Server Action. Lead stored in DB. Landing page SEO metadata. Git commit: "feat: auth, landing, and project foundation." |

**Success criteria Week 1:**
- [x] `pnpm dev` runs without errors
- [x] Login works and redirects by role
- [x] Landing page is responsive and CTA saves to database
- [x] `prisma studio` shows seeded data

### Week 2: Core CRUD + Sessions (Days 6-10)

| Day | Tasks |
|-----|-------|
| 6 | Student management: service, Server Actions, list component, form component. |
| 7 | Teacher management: service, Server Actions, list, form, availability editor. |
| 8 | Rooms & time slots CRUD. |
| 9 | Session service: generate from templates, list by week. Session calendar component (custom grid). |
| 10 | Session form (create/edit dialog). Teacher + student schedule views (read-only). Git commit: "feat: CRUD for students, teachers, rooms, sessions." |

**Success criteria Week 2:**
- [x] Admin can create/edit/delete students, teachers, rooms, time slots
- [x] Teacher availability grid works
- [x] Session calendar renders correctly
- [x] Sessions are generated from templates

### Week 3: The Brain + Chat + Notifications (Days 11-15)

| Day | Tasks |
|-----|-------|
| 11 | Assignment algorithm: pure function + 10 unit tests. Run `pnpm test` — all pass. |
| 12 | Assignment service (DB orchestration). Admin assignments page: run + review draft. |
| 13 | Enrollment creation on approval. Conflict detection. Enrollment tests. |
| 14 | Chat: service, conversation model, student page, admin inbox. Supabase Realtime setup. |
| 15 | Notifications: service, bell component, triggers wired to session + chat events. Git commit: "feat: auto-assignment, chat, notifications." |

**Success criteria Week 3:**
- [x] Assignment algorithm produces correct drafts (unit tests green)
- [x] Admin can run assignment, review, approve/reject
- [x] Chat messages appear in real-time
- [x] Notification bell shows unread count

### Week 4: Wellbeing + Dashboards + Polish (Days 16-20)

| Day | Tasks |
|-----|-------|
| 16 | ContentItem CRUD (admin). Student methodology page. Breathing exercise component. |
| 17 | Mood check-in: slider component, Server Action, mood history page. Mood aggregation logic. |
| 18 | Admin dashboard: stats cards, fill rate gauge, enrollment chart, stress heatmap. |
| 19 | Teacher dashboard + student dashboard. Exam protocol. |
| 20 | E2E tests (3 flows). Bug fixes. Polish. Deploy to Vercel. Git commit: "feat: wellbeing, dashboards, E2E tests." |

**Success criteria Week 4:**
- [x] Breathing exercise animates correctly
- [x] Mood check-ins save and aggregate
- [x] Admin dashboard shows live data
- [x] 3 E2E tests pass
- [x] App is deployed to Vercel and accessible

---

## 7. How to Run, Test, Deploy

### Local Development

```bash
# Start the dev server
pnpm dev
# Open http://localhost:3000

# Open Prisma Studio (database browser)
pnpm prisma studio
# Open http://localhost:5555

# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run E2E tests (start dev server first, or let Playwright do it)
pnpm test:e2e

# Lint
pnpm lint

# Type check
pnpm tsc --noEmit
```

### Deploying to Vercel

1. Push your code to GitHub.
2. Go to https://vercel.com/new, import your repository.
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL` (Supabase pooled connection string)
   - `DIRECT_URL` (Supabase direct connection string)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Vercel will run `next build` automatically.
5. After first deploy, run migrations against production:
   ```bash
   DATABASE_URL="<production-url>" pnpm prisma migrate deploy
   ```

### Basic CI (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test
```

---

## 8. Common Pitfalls & How to Avoid Them

1. **Mixing client and server Supabase clients.** The browser client (`createBrowserClient`) and server client (`createServerClient`) are NOT interchangeable. Using the browser client on the server will fail to read cookies. Using the server client on the browser will crash because `cookies()` is a server-only API. Rule: if the file has `"use client"`, use `src/lib/supabase/client.ts`. Otherwise, use `src/lib/supabase/server.ts`.

2. **Not invalidating TanStack Query cache after mutations.** When a Server Action creates a student, the student list fetched via TanStack Query will be stale. Call `queryClient.invalidateQueries({ queryKey: ["students"] })` after the mutation. Or better: use `revalidatePath` in Server Actions and fetch data in Server Components instead of TanStack Query for simple CRUD pages.

3. **Timezone handling for sessions.** Sessions have dates and times. Store all dates in UTC in the database. Convert to the user's timezone (France = `Europe/Paris`) only when displaying. Use `date-fns-tz` if needed. The `date` field on `Session` should be a UTC date. The time comes from the `TimeSlot`.

4. **Prisma client not being a singleton in development.** Next.js hot-reloads in dev, creating new Prisma clients each time. This exhausts database connections. Use the singleton pattern:

```ts
// src/server/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

5. **Forgetting Supabase Realtime requires table replication.** Supabase Realtime only works on tables that have replication enabled. Go to Supabase Dashboard > Database > Replication, and enable it for the `Message` and `Notification` tables.

6. **Not handling the "zero state."** When there are no students, no sessions, no data — the dashboard should not crash or show NaN. Check for empty arrays and show helpful empty states: "Aucun élève pour le moment. Commencez par en ajouter un."

7. **RGPD (GDPR) compliance.** You are storing student data, including minors. Requirements:
   - Privacy policy page explaining what data is collected and why
   - Consent checkbox on the CTA form
   - Ability to export a student's data (admin function)
   - Ability to delete a student and all their data (cascade deletes in Prisma help here)
   - Do not store data you do not need

8. **Deploying without running migrations.** Vercel builds do not run Prisma migrations automatically. After deploying schema changes, you must run `prisma migrate deploy` against the production database manually (or add it to a CI step).

9. **Hardcoding French strings in components.** For MVP this is acceptable, but structure strings as constants or a simple i18n file from the start if you anticipate multi-language support later.

10. **Not setting up Row Level Security (RLS) in Supabase.** If you use the Supabase client directly (not just Prisma), you must configure RLS policies on your tables. Otherwise, the anon key can access all data. For this project, since we use Prisma for all data access (server-side), RLS is less critical — but enable it as defense in depth, especially on the `Message` table.

---

## 9. Next Steps After MVP

These are ideas for v1.1 and beyond, ordered roughly by impact:

1. **Email notifications** — Send emails for session assignments, cancellations, and exam reminders. Use Resend or Supabase Edge Functions with a transactional email provider.

2. **Progressive Web App (PWA)** — Add a web manifest and service worker so students can "install" the app on their phone. next-pwa makes this straightforward.

3. **Parent portal** — A read-only dashboard for parents showing their child's schedule, mood trends, and methodology progress. New role: `PARENT`.

4. **Payment integration** — Stripe for session packages (10 sessions, monthly subscription). Track payment status per student.

5. **Advanced optimizer** — Replace the greedy algorithm with a constraint solver (OR-Tools via a Python microservice, or a WASM build). This would handle complex constraints like "student A and student B should not be in the same group."

6. **Video session integration** — Embed Jitsi or Daily.co for online tutoring sessions. Add a "Rejoindre" button on session cards.

7. **AI-powered methodology recommendations** — Use an LLM to analyze a student's mood trends + exam dates + content completion, and suggest personalized next actions: "Tu sembles stressé cette semaine. Essaie l'exercice de respiration avant ton prochain cours de maths."

8. **CSV/Excel import and export** — Bulk import students from a spreadsheet. Export session reports for accounting.

9. **Audit log viewer** — Admin page showing all actions (who changed what, when). The `AuditLog` table is already in the schema.

10. **Analytics export** — PDF reports for parents or school partners showing student progress over a semester.

---

**Ready to start? Confirm "yes" and I will generate the initial project scaffolding, or say which phase you want to deep-dive into first.**
agentId: aa3d05befa70bae60 (for resuming to continue this agent's work if needed)
<usage>total_tokens: 41451
tool_uses: 0
duration_ms: 428277</usage>