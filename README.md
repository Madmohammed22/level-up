# LEVEL UP

Web application for a tutoring center. Manages students, teachers, sessions
with intelligent class fill-rate optimization, plus a wellbeing layer
(stress management, methodology, time management) as a differentiator.

Value proposition: **Réussir ses examens sans stress.**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Tailwind CSS 4**
- **Prisma 7** + **PostgreSQL** (via Supabase)
- **Supabase** for Auth, Realtime (chat), Storage
- **Zod** for validation (shared client/server schemas)
- **TanStack Query** for server state on the client
- **Recharts** for dashboards
- **Vitest** for unit tests (algorithm + pure domain logic)
- **Playwright** for E2E tests
- Deploy: **Vercel** + **Supabase**

## Quickstart

```bash
# 1. Install deps (pnpm >= 9)
corepack enable && corepack prepare pnpm@latest --activate
pnpm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Push the Prisma schema to your DB & seed
pnpm db:push
pnpm db:seed

# 4. Run the dev server
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build (runs `prisma generate`) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm db:migrate` | Create + apply a migration |
| `pnpm db:push` | Push schema without migration (dev only) |
| `pnpm db:seed` | Run `prisma/seed.ts` |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |

## Project layout

```
src/
├── app/                    # Next.js App Router
│   ├── (landing)/          # Public landing page
│   ├── (auth)/             # Login / register
│   ├── (dashboard)/        # Protected dashboards per role
│   └── api/                # Route Handlers
├── components/
│   ├── landing/            # Hero, sections, CTA form
│   ├── shared/             # Navbar, Sidebar, NotificationBell
│   ├── features/           # Feature-scoped composites
│   └── ui/                 # shadcn primitives
├── server/
│   ├── db/prisma.ts        # Prisma singleton
│   ├── domain/             # PURE functions (no DB, no side effects)
│   │   ├── scheduling/     # Auto-assignment + conflict detection
│   │   ├── wellbeing/      # Mood aggregation, exam protocols
│   │   ├── messaging/      # Chat logic
│   │   └── analytics/      # Fill-rate math
│   ├── services/           # Orchestration: Prisma + domain fns
│   ├── actions/            # Next.js Server Actions
│   └── auth/               # Supabase user + role guards
├── lib/
│   ├── supabase/           # Browser + server clients
│   └── utils.ts
├── types/
│   └── schemas.ts          # Zod schemas (shared)
├── generated/prisma/       # Prisma client output (gitignored)
└── tests/
    ├── unit/               # Vitest
    └── e2e/                # Playwright
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
docs/
└── LEVEL_UP_PLAN.md        # Full implementation plan
```

## The assignment algorithm (in short)

Lives at `src/server/domain/scheduling/assignment.ts`. A **pure function**
`proposeAssignments(input)` that takes students, teachers, rooms, time slots,
and an admin-configured level-compatibility matrix, and returns:

- proposed sessions (with mutualization when levels are compatible and groups
  are small)
- students it could not place
- a score (fill rate, merged-class count, unassigned count)

The admin reviews this **draft**, then approves → persists Sessions +
Enrollments.

Tests: `src/tests/unit/scheduling/assignment.test.ts` (10 cases).

## Status

Initial scaffold. Working: landing page, Prisma schema, assignment algorithm
+ tests. Next up: Supabase Auth integration, admin CRUD for students/teachers/
rooms/time slots, calendar view, draft-approve UI for the algorithm.

See `docs/LEVEL_UP_PLAN.md` for the complete feature-by-feature guide.
