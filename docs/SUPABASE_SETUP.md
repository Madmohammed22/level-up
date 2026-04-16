# Supabase setup — Phase A, item 1

This is a one-time manual step. After completing it, `pnpm dev` will run
against a real database and auth will actually work.

---

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard → **New Project**.
2. Name: `level-up`. Region: pick the one closest to your users
   (e.g. `eu-west-2` / Paris for France).
3. Set a strong database password — **save it in a password manager**.
4. Wait ~2 minutes for the project to provision.

## 2. Copy your credentials

In the Supabase dashboard:

- **Settings → API**
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

- **Settings → Database → Connection string → URI**
  - Copy the **"Session pooler"** URI (it looks like
    `postgresql://postgres.xxx:PASSWORD@aws-xxx.pooler.supabase.com:5432/postgres`)
  - Replace `[YOUR-PASSWORD]` with the DB password from step 1.
  - This is your `DATABASE_URL`.

## 3. Fill `.env.local`

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
# The connection string suffix `?sslmode=require&uselibpqcompat=true` is MANDATORY:
#  - `sslmode=require` tells pg to use TLS (required by the Supabase pooler)
#  - `uselibpqcompat=true` opts into libpq semantics so `require` means "encrypt"
#    instead of pg v3's stricter "verify-full", which rejects Supabase's cert chain.
# Use the **Session pooler** (port 5432), NOT the Transaction pooler (6543).
DATABASE_URL="postgresql://postgres.xxx:YOUR_DB_PASSWORD@aws-xxx.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Push the Prisma schema

```bash
pnpm db:push
```

This creates every table, enum, and constraint from `prisma/schema.prisma`
in your Supabase database. Check Supabase dashboard → **Table Editor**: you
should see `User`, `StudentProfile`, `Room`, `Session`, etc.

## 5. Seed demo data

```bash
pnpm db:seed
```

Creates 3 subjects, 2 rooms, 10 time slots, 2 teachers, 10 students,
a compatibility matrix, 3 content items, and an **admin account you can
log in with immediately** (provided `SUPABASE_SERVICE_ROLE_KEY` is set):

- Email: `admin@levelup.demo`
- Password: `LevelUp!Admin2026`

Override with env vars before seeding:

```bash
SEED_ADMIN_EMAIL=me@example.com \
SEED_ADMIN_PASSWORD='your-strong-pass' \
SEED_ADMIN_NAME='Your Name' \
pnpm db:seed
```

## 6. Alternative — register then promote yourself

If you'd rather create your own account through the app:

1. `pnpm dev`
2. Go to http://localhost:3000/register
3. Create an account. You'll be created as `STUDENT` by default.
4. In Supabase **SQL Editor**:

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE email = 'your-email@example.com';
```

5. Log out and log back in. You'll be redirected to `/admin`.

## 7. Lock down the public API (RLS)

The anon key is, by design, public — it's shipped to the browser. Without
Row-Level Security, anyone holding it can query every table via
`$NEXT_PUBLIC_SUPABASE_URL/rest/v1/<Table>`.

This app never queries `public.*` through the supabase client — all data
flows through Prisma using the `postgres` role, which has `BYPASSRLS`. So
a pure deny-all RLS posture (no policies) is correct.

Run after every schema change:

```bash
pnpm db:rls
```

Verify the anon key is blocked:

```bash
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/User?select=email"
# Should return: []
```

If you ever start using `supabase.from('Table')` client-side, you'll need
explicit policies — see https://supabase.com/docs/guides/auth/row-level-security.

## 8. Auth settings to check

- **Authentication → Providers → Email**: enable, **disable "Confirm email"**
  for local dev (otherwise you'll need to click a confirmation link).
  Re-enable it before going to production.
- **Authentication → URL Configuration**: add
  `http://localhost:3000/auth/callback` to redirect URLs.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `Can't reach database server` on `db:push` | Check `DATABASE_URL` uses the **Session pooler** URI (port 5432) with `?pgbouncer=true` is **not** needed for the session pooler. |
| `ECONNREFUSED` on `pnpm db:seed` (but `db:push` works) | Three root causes (all handled once configured correctly): (1) Node 18+ prefers IPv6 DNS, which the Supabase pooler can't answer — fixed via `NODE_OPTIONS='--dns-result-order=ipv4first'` in `package.json`. (2) `tsx` doesn't load `.env`/`.env.local` automatically — `prisma/seed.ts` now does it explicitly via `dotenv`. (3) The `pg` driver needs explicit TLS — append `?sslmode=require` to `DATABASE_URL`. |
| `Error opening a TLS connection: self-signed certificate in certificate chain` | `pg-connection-string` v2+ treats `sslmode=require` as `verify-full`. Supabase's cert chain isn't in Node's default CA bundle, so verification fails. Fix: add `&uselibpqcompat=true` to the URL to opt into libpq semantics (just encrypt, no verify). |
| `db:push` hangs or times out | Prisma CLI reads `.env`, NOT `.env.local`. Put your `DATABASE_URL` in `.env` (or symlink / copy `.env.local` → `.env`). |
| Login shows "Invalid credentials" | Make sure the Supabase Auth user exists and email is confirmed (or auto-confirm is on). |
| After login, redirected back to `/login` | Your Prisma `User` row doesn't have `authId` set. Either log out + sign up again, or run the Path B SQL update. |
| `next dev` warns about React compiler | Safe to ignore for local dev. |

## 9. What's next after this

Once you can log in as ADMIN and land on `/admin`, we move to Phase B:
admin CRUD for students, teachers, rooms, time slots.
