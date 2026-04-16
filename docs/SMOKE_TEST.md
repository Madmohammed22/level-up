# End-to-end smoke test

Walk through every feature once after setup to confirm the full stack works
end-to-end. Each step has an **expected result** — if it doesn't match, stop
and fix before moving on.

Prereqs:
- `pnpm install` done
- `.env` filled in, all JWTs on single lines, `DATABASE_URL` has
  `?sslmode=require&uselibpqcompat=true`
- `pnpm db:push` completed without errors
- `pnpm db:seed` printed `Seed done.`

---

## 0. Sanity check (before touching the UI)

```bash
pnpm typecheck
pnpm lint
pnpm test
```

**Expected:** all three exit 0. 16/16 tests pass.

Open Supabase dashboard → **Table Editor** and spot-check:
- `User` — at least 13 rows (1 admin, 2 teachers, 10 students)
- `Subject` — 3 rows (Maths, Physique, Francais)
- `Room` — 2 rows
- `TimeSlot` — 10 rows
- `StudentAvailability` — 100 rows (10 students × 10 slots)

If any of these are empty → re-run `pnpm db:seed`.

---

## 1. Admin login (auto-bootstrapped)

`pnpm db:seed` creates the admin end-to-end:

- Supabase auth user (via `SUPABASE_SERVICE_ROLE_KEY`)
- Matching Prisma `User` row with `authId` linked

Default credentials (printed at the end of the seed):

- Email: `admin@levelup.demo`
- Password: `LevelUp!Admin2026`

Override any time via env before running the seed:

```bash
SEED_ADMIN_EMAIL=me@example.com \
SEED_ADMIN_PASSWORD='your-strong-pass' \
SEED_ADMIN_NAME='Your Name' \
pnpm db:seed
```

The seed is idempotent — re-running resets the password to the current value
and re-links `authId`. If `SUPABASE_SERVICE_ROLE_KEY` is missing the seed will
still succeed but the admin row will have no `authId` (login will fail until
you set the key and re-run).

---

## 2. Start the dev server

```bash
pnpm dev
```

**Expected:**
- No red errors in the terminal
- Compiles within ~5s
- Opens on `http://localhost:3000`

Open the browser DevTools console and keep it visible throughout this test —
uncaught errors there are real bugs.

---

## 3. Landing page

Visit `http://localhost:3000/`.

**Expected:**
- Hero with the headline "Améliore tes notes et maîtrise ton stress"
- Problem / Solution / Features / Results sections render
- CTA form at the bottom

**Test:** submit the CTA form with a fake name + email.

**Expected:**
- Success confirmation in the UI
- New row in `LeadSubmission` table in Supabase

---

## 4. Register flow (public user)

Visit `/register`.

**Test:** create a new account with email `test-student@example.com` + password.

**Expected:**
- No `Headers.append` error (if yes → your JWT has a newline, see
  `SUPABASE_SETUP.md`)
- Redirect to `/student` (default role is STUDENT)
- Sidebar shows student links only

**Cleanup:** we'll delete this user later; ignore for now.

---

## 5. Login as admin

Sign out, visit `/login`, use `admin@levelup.demo` + the password from step 1.

**Expected:**
- Redirect to `/admin`
- Navbar shows admin name
- Sidebar shows all admin links (Tableau de bord, Élèves, Professeurs, Matières,
  Salles, Créneaux, Séances, Affectations, Contenus, Messages)

---

## 6. Admin CRUD (each resource)

Walk every page, confirm it renders seeded data + lets you create:

| Page | Expected rows from seed | Test action |
|---|---|---|
| `/admin/subjects` | Maths, Physique, Francais | Create "Anglais", then delete it |
| `/admin/rooms` | Salle A, Salle B | Create "Salle C", capacity 8 |
| `/admin/timeslots` | 10 slots Mon-Fri × 2 | Create Saturday 10:00-11:30 |
| `/admin/teachers` | Claire Durand, Paul Martin | Create one with at least 1 subject |
| `/admin/students` | 10 seeded students | Create one with level + subjects |

**For each:** form submits without error, list refreshes with the new row,
delete button removes it cleanly.

**Expected pitfall:** delete on a `Subject` that's referenced by students should
show a French error message, not a 500.

---

## 7. Auto-assignment (the headline feature)

Visit `/admin/assignments`.

**Expected:** week picker defaulting to this week. Three score cards (Taux de
remplissage, Mutualisations, Non affectés).

**Test 1 — preview:**
- Leave the week as-is
- Page renders a table of proposed sessions + an "unassigned" list if any

**Expected:**
- Fill rate is > 0% (if 0%, something in the algorithm isn't matching — usually
  because no teacher has availability for the subject)
- At least one session proposed for Maths (3 seeded students take it)
- Mutualisation count > 0 if Grade 10 and Grade 11 students were merged

**Test 2 — commit:**
- Click "Commit assignments"

**Expected:**
- Button disables during request
- Success message
- Page refreshes with the same data
- `Session` table in Supabase has new rows
- `Enrollment` table has rows linking students to sessions

**Test 3 — idempotency:**
- Click "Commit" again on the same week

**Expected:** no duplicate rows created (the `@@unique([roomId, startAt])`
constraint catches it; the action should skip silently).

---

## 8. Admin → session management

Visit `/admin/sessions`.

**Expected:**
- Sessions grouped by week
- Status badges: SCHEDULED
- Cancel button on each row

**Test:** cancel one session.

**Expected:** status flips to CANCELLED, row stays visible but greyed out.

---

## 9. Student view

Sign out. Log in as a seeded student (e.g. `emma@levelup.demo` — but first
create her Supabase auth account the same way as step 1, and link `authId`).

Quick version — run this SQL in Supabase to create + link in one go for
`emma@levelup.demo`:

```sql
-- After creating the auth user via dashboard with email emma@levelup.demo
UPDATE "User"
SET "authId" = (SELECT id FROM auth.users WHERE email = 'emma@levelup.demo')
WHERE email = 'emma@levelup.demo';
```

Log in as Emma.

**Expected:** redirect to `/student`.

Walk:

| Page | Expected |
|---|---|
| `/student/schedule` | Sessions Emma is enrolled in (from step 7 commit), grouped by week, no CANCELLED ones |
| `/student/methodology` | 3 seeded content items; click "Marquer comme fait" — stays marked on refresh |
| `/student/mood` | Emoji selector; submit a check-in with a note; appears in the 7-day history with correct emoji + date |
| `/student/chat` | Empty thread + input; send a message to admin |

---

## 10. Teacher view

Repeat step 1's admin-creation flow for `prof.durand@levelup.demo` (Claire Durand).
Log in as Claire.

**Expected:** redirect to `/teacher`.

| Page | Expected |
|---|---|
| `/teacher/schedule` | Sessions she teaches (subset of step 7's output), grouped by week |
| `/teacher/students` | Deduplicated list of students across her sessions, with subjects + session count |

---

## 11. Admin ↔ student chat

Log back in as admin → visit `/admin/chat`.

**Expected:**
- Emma's conversation appears in the inbox with an unread badge (from step 9)
- Click it → thread opens → her message visible
- Reply from admin
- Sign out, log back as Emma, visit `/student/chat` → admin reply visible;
  no unread badge on admin side anymore on refresh

---

## 12. Proxy / auth gate

While logged out, try to visit:
- `/admin` → redirects to `/login?next=/admin`
- `/teacher` → redirects to `/login?next=/teacher`
- `/student` → redirects to `/login?next=/student`

While logged in as student, try `/admin` → redirect or 403.

**Expected:** no page leaks data to the wrong role.

---

## 13. Cleanup (optional)

Delete the test users you created:
1. Supabase dashboard → **Authentication → Users** → delete `test-student@example.com`
2. `DELETE FROM "User" WHERE email = 'test-student@example.com';`

---

## Pass criteria

All 13 steps green → app is **end-to-end functional** and ready for Phase E
(analytics dashboard, notifications, content CRUD).

If anything failed, note the step number and the exact error — that's what
we fix before adding features.
